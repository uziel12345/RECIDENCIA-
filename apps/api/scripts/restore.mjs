import dotenv from "dotenv";
import { existsSync, mkdirSync, readdirSync, rmSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join, relative, resolve } from "path";
import { resolvePgBinary } from "./pg-bin.mjs";

const apiRoot = dirname(dirname(fileURLToPath(import.meta.url)));
dotenv.config({ path: join(apiRoot, ".env") });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`Comando falló (${result.status}): ${command} ${args.join(" ")}`);
  }
}

function main() {
  const archivePath = process.argv[2];
  const force = process.argv.includes("--force");

  if (!archivePath) {
    console.error(
      "Uso: node scripts/restore.mjs <ruta-al-backup.tar.gz> [--force]\n\n" +
      "--force sobreescribe apps/api/uploads/ si ya tiene contenido " +
      "(por defecto se detiene para no perder archivos existentes)."
    );
    process.exit(1);
  }

  const resolvedArchive = resolve(archivePath);
  if (!existsSync(resolvedArchive)) {
    throw new Error(`No existe el archivo: ${resolvedArchive}`);
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error(
      "Faltan variables de entorno de BD (DB_HOST/DB_USER/DB_PASSWORD/DB_NAME). " +
      "Revisa apps/api/.env — restaura contra la BD que ahí se define."
    );
  }

  const uploadsDir = join(apiRoot, "uploads");
  if (!force && existsSync(uploadsDir) && readdirSync(uploadsDir).length > 0) {
    throw new Error(
      `apps/api/uploads/ ya tiene archivos — para no perderlos, este script no ` +
      `sobreescribe por defecto. Vacía/mueve esa carpeta primero, o vuelve a ` +
      `correr con --force si de verdad quieres reemplazarla.`
    );
  }

  const workDir = join(apiRoot, "backups", `_restore-tmp-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });

  try {
    console.log("Extrayendo backup...");
    // cwd=workDir + rutas relativas evita pasarle a tar un absoluto de
    // Windows ("C:\...") — este `tar` (Git Bash/MSYS) lo confunde con
    // sintaxis de host remoto ("Cannot connect to C:").
    run("tar", ["-xzf", relative(workDir, resolvedArchive), "-C", "."], {
      cwd: workDir,
    });

    console.log(`Restaurando base de datos "${DB_NAME}" (--clean --if-exists)...`);
    const pgRestore = resolvePgBinary("pg_restore");
    run(
      pgRestore,
      [
        "--host", DB_HOST,
        "--port", String(DB_PORT ?? 5432),
        "--username", DB_USER,
        "--dbname", DB_NAME,
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-password",
        join(workDir, "database.dump"),
      ],
      { env: { ...process.env, PGPASSWORD: DB_PASSWORD } }
    );

    console.log("Restaurando uploads/...");
    rmSync(uploadsDir, { recursive: true, force: true });
    mkdirSync(uploadsDir, { recursive: true });
    const extractedUploads = join(workDir, "uploads");
    if (process.platform === "win32") {
      const result = spawnSync("robocopy", [extractedUploads, uploadsDir, "/E"], {
        stdio: "inherit",
      });
      if ((result.status ?? 8) >= 8) {
        throw new Error(`robocopy falló con código ${result.status}`);
      }
    } else {
      run("cp", ["-r", `${extractedUploads}/.`, uploadsDir]);
    }

    console.log("\nRestauración completa.");
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main();
