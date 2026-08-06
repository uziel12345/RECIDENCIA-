import fs from "node:fs/promises";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/functions";
import {
  resolveGlbName,
  toRuntimeGlbName,
} from "../src/components/viewer/glb-utils.ts";

const DEFAULT_API_URL =
  "https://recorridovirtual-ito.tailc9c1c3.ts.net/api/buildings";
const DEFAULT_GLB_PATH = "public/models/campus.glb";
const DEFAULT_MIGRATION_ID = "20260804_glb_actual";

function readArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`Argumento inválido: ${key ?? "vacío"}`);
    }
    values.set(key.slice(2), value);
  }
  return values;
}

function normalizedNodeName(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function sqlText(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function roundCoordinate(value) {
  return Number(value.toFixed(4));
}

async function readBuildings(args) {
  const inputEnvironment = args.get("input-env");
  if (inputEnvironment) {
    const encoded = process.env[inputEnvironment];
    if (!encoded) throw new Error(`Falta la variable ${inputEnvironment}`);
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  }

  const inputPath = args.get("input");
  if (inputPath) {
    const parsed = JSON.parse(await fs.readFile(path.resolve(inputPath), "utf8"));
    return Array.isArray(parsed) ? parsed : parsed.data;
  }

  const apiUrl = args.get("api-url") ?? DEFAULT_API_URL;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status} en ${apiUrl}`);
  }
  const parsed = await response.json();
  return parsed.data;
}

function createSql(matchedRows, migrationId) {
  if (!/^[a-z0-9_]+$/.test(migrationId)) {
    throw new Error("migration-id solo admite minúsculas, números y guion bajo");
  }

  const values = matchedRows
    .map(
      (row) =>
        `  (${sqlText(row.id)}, ${sqlText(row.model_node_name)}, ${row.current_x.toFixed(4)}, ${row.current_z.toFixed(4)})`,
    )
    .join(",\n");
  const backupBuildings = `buildings_backup_${migrationId}`;
  const backupPoints = `calibration_points_backup_${migrationId}`;
  const backupProfiles = `calibration_profiles_backup_${migrationId}`;

  return `-- Coordenadas extraídas de apps/web/public/models/campus.glb.
-- Generado por: pnpm --filter web audit:model-coordinates
-- Actualiza solo registros con id + model_node_name todavía coincidentes.

BEGIN;

CREATE TEMP TABLE target_building_model_coordinates (
  id VARCHAR(36) PRIMARY KEY,
  model_node_name VARCHAR(255) NOT NULL,
  x DECIMAL(10,4) NOT NULL,
  z DECIMAL(10,4) NOT NULL
) ON COMMIT DROP;

INSERT INTO target_building_model_coordinates (id, model_node_name, x, z) VALUES
${values};

CREATE TABLE IF NOT EXISTS ${backupBuildings} (LIKE buildings INCLUDING ALL);
INSERT INTO ${backupBuildings}
SELECT b.*
FROM buildings b
INNER JOIN target_building_model_coordinates t ON t.id = b.id
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS ${backupPoints} (LIKE campus_calibration_points INCLUDING ALL);
INSERT INTO ${backupPoints}
SELECT cp.*
FROM campus_calibration_points cp
INNER JOIN target_building_model_coordinates t ON t.id = cp.building_id
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS ${backupProfiles} (LIKE campus_calibration_profiles INCLUDING ALL);
INSERT INTO ${backupProfiles}
SELECT profile.* FROM campus_calibration_profiles profile
ON CONFLICT (id) DO NOTHING;

UPDATE buildings b
SET x = t.x,
    z = t.z
FROM target_building_model_coordinates t
WHERE b.id = t.id
  AND b.model_node_name = t.model_node_name;

-- Los puntos guardan una copia de X/Z; se sincronizan con el nodo actual.
UPDATE campus_calibration_points cp
SET model_x = b.x,
    model_z = b.z
FROM buildings b
INNER JOIN target_building_model_coordinates t ON t.id = b.id
WHERE cp.building_id = b.id;

-- Un perfil affine calculado contra el modelo anterior no debe seguir activo.
UPDATE campus_calibration_profiles SET is_active = FALSE WHERE is_active = TRUE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM target_building_model_coordinates t
    LEFT JOIN buildings b ON b.id = t.id
    WHERE b.id IS NULL
       OR b.model_node_name <> t.model_node_name
       OR ABS(b.x - t.x) > 0.0001
       OR ABS(b.z - t.z) > 0.0001
  ) THEN
    RAISE EXCEPTION 'La verificación de coordenadas GLB falló; se revierte la transacción';
  END IF;
END $$;

COMMIT;
`;
}

async function writeOutput(filePath, contents) {
  if (!filePath) return;
  const resolved = path.resolve(filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, contents, "utf8");
}

const args = readArguments(process.argv.slice(2));
const buildings = await readBuildings(args);
if (!Array.isArray(buildings)) throw new Error("La entrada no contiene edificios");

const glbPath = path.resolve(args.get("glb") ?? DEFAULT_GLB_PATH);
const document = await new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .read(glbPath);
const nodes = document.getRoot().listNodes();
const exactNodes = new Map(nodes.map((node) => [node.getName(), node]));
const normalizedNodes = new Map(
  nodes
    .filter((node) => node.getName())
    .map((node) => [normalizedNodeName(node.getName()), node]),
);

function findNode(modelNodeName) {
  if (!modelNodeName) return null;
  const canonicalName = resolveGlbName(modelNodeName);
  const trimmedName = canonicalName.trim().replace(/\s+/g, " ");
  return (
    exactNodes.get(canonicalName) ??
    exactNodes.get(trimmedName) ??
    exactNodes.get(toRuntimeGlbName(canonicalName)) ??
    normalizedNodes.get(normalizedNodeName(trimmedName)) ??
    null
  );
}

const rows = buildings.map((building) => {
  const node = findNode(building.model_node_name);
  const common = {
    id: building.id,
    code: building.code,
    name: building.name,
    active: Boolean(building.is_active),
    model_node_name: building.model_node_name ?? null,
  };
  if (!node) return { ...common, status: "missing-node" };

  const bounds = getBounds(node);
  const currentX = roundCoordinate((bounds.min[0] + bounds.max[0]) / 2);
  const currentZ = roundCoordinate((bounds.min[2] + bounds.max[2]) / 2);
  const oldX = building.x === null ? null : Number(building.x);
  const oldZ = building.z === null ? null : Number(building.z);
  return {
    ...common,
    status: "matched",
    glb_node_name: node.getName(),
    old_x: oldX,
    old_z: oldZ,
    current_x: currentX,
    current_z: currentZ,
    delta:
      oldX === null || oldZ === null
        ? null
        : Number(Math.hypot(currentX - oldX, currentZ - oldZ).toFixed(4)),
    bounds: {
      min_x: roundCoordinate(bounds.min[0]),
      max_x: roundCoordinate(bounds.max[0]),
      min_z: roundCoordinate(bounds.min[2]),
      max_z: roundCoordinate(bounds.max[2]),
    },
  };
});

const matchedRows = rows.filter((row) => row.status === "matched");
const missingRows = rows.filter((row) => row.status === "missing-node");
const report = {
  generated_at: new Date().toISOString(),
  glb_path: path.relative(process.cwd(), glbPath).replaceAll("\\", "/"),
  summary: {
    total: rows.length,
    active: rows.filter((row) => row.active).length,
    matched: matchedRows.length,
    missing: missingRows.length,
    changed_over_1_unit: matchedRows.filter(
      (row) => row.delta === null || row.delta > 1,
    ).length,
    changed_over_25_units: matchedRows.filter(
      (row) => row.delta === null || row.delta > 25,
    ).length,
  },
  rows,
};

const csvColumns = [
  "id",
  "code",
  "name",
  "active",
  "status",
  "model_node_name",
  "glb_node_name",
  "old_x",
  "old_z",
  "current_x",
  "current_z",
  "delta",
];
const csv = [
  csvColumns.join(","),
  ...rows.map((row) => csvColumns.map((column) => csvCell(row[column])).join(",")),
].join("\n");

await writeOutput(args.get("output-json"), `${JSON.stringify(report, null, 2)}\n`);
await writeOutput(args.get("output-csv"), `${csv}\n`);
await writeOutput(
  args.get("output-sql"),
  createSql(matchedRows, args.get("migration-id") ?? DEFAULT_MIGRATION_ID),
);

console.log(JSON.stringify(report.summary, null, 2));
if (missingRows.length > 0) {
  console.log(
    `Sin nodo actual: ${missingRows.map((row) => row.code).join(", ")}`,
  );
}
