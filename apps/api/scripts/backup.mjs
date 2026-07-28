import dotenv from "dotenv";
import { existsSync, mkdirSync, rmSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { basename, dirname, join } from "path";
import { resolvePgBinary } from "./pg-bin.mjs";

const apiRoot = dirname(dirname(fileURLToPath(import.meta.url)));
dotenv.config({ path: join(apiRoot, ".env") });

function timestamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`Comando falló (${result.status}): ${command} ${args.join(" ")}`);
  }
}

function main() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error(
      "Faltan variables de entorno de BD (DB_HOST/DB_USER/DB_PASSWORD/DB_NAME). " +
      "Revisa apps/api/.env."
    );
  }

  const backupsDir = join(apiRoot, "backups");
  mkdirSync(backupsDir, { recursive: true });

  const ts = timestamp();
  const workDir = join(backupsDir, `_tmp-${ts}`);
  mkdirSync(workDir, { recursive: true });

  const dumpFile = join(workDir, "database.dump");
  const uploadsDir = join(apiRoot, "uploads");
  const finalArchive = join(backupsDir, `backup-${DB_NAME}-${ts}.tar.gz`);

  console.log(`Respaldando base de datos "${DB_NAME}"...`);
  const pgDump = resolvePgBinary("pg_dump");
  run(
    pgDump,
    [
      "--host", DB_HOST,
      "--port", String(DB_PORT ?? 5432),
      "--username", DB_USER,
      "--dbname", DB_NAME,
      "--format", "custom",
      "--file", dumpFile,
      "--no-password",
    ],
    { env: { ...process.env, PGPASSWORD: DB_PASSWORD } }
  );

  // Copia liviana de uploads/ dentro del mismo directorio temporal, para
  // empaquetar ambos con un solo `tar` — así el backup final es un único
  // archivo que ya trae BD + imágenes, listo para mover a otra máquina.
  const workUploadsDir = join(workDir, "uploads");
  if (existsSync(uploadsDir)) {
    console.log("Copiando uploads/...");
    if (process.platform === "win32") {
      // robocopy usa 0-7 como "éxito" (bitmask de qué copió), no solo 0 —
      // no se puede usar el helper run() genérico aquí.
      const result = spawnSync("robocopy", [uploadsDir, workUploadsDir, "/E"], {
        stdio: "inherit",
      });
      if ((result.status ?? 8) >= 8) {
        throw new Error(`robocopy falló con código ${result.status}`);
      }
    } else {
      mkdirSync(workUploadsDir, { recursive: true });
      run("cp", ["-r", `${uploadsDir}/.`, workUploadsDir]);
    }
  } else {
    mkdirSync(workUploadsDir, { recursive: true });
    console.log("(No había carpeta uploads/ — se incluye vacía.)");
  }

  console.log("Empaquetando...");
  // `-C workDir` sin más + cwd=backupsDir evita pasarle a tar una ruta
  // absoluta de Windows ("C:\...") — este `tar` (Git Bash/MSYS) la confunde
  // con sintaxis de host remoto ("Cannot connect to C:") sin importar si
  // se usan backslash o forward slash.
  run(
    "tar",
    ["-czf", basename(finalArchive), "-C", basename(workDir), "database.dump", "uploads"],
    { cwd: backupsDir }
  );

  rmSync(workDir, { recursive: true, force: true });

  console.log(`\nListo: ${finalArchive}`);
}

main();
