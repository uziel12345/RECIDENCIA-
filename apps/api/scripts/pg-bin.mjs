import { existsSync, readdirSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";

// Encuentra pg_dump/pg_restore/psql sin asumir que están en PATH — en
// Windows normalmente NO lo están aunque PostgreSQL esté instalado. Orden:
// 1) variable de entorno PG_BIN_DIR (override manual),
// 2) el comando tal cual, si ya está en PATH (typico en Linux/macOS con
//    postgresql-client instalado — el caso del futuro servidor externo),
// 3) las rutas típicas de instalación en Windows.
export function resolvePgBinary(name) {
  const exeName = process.platform === "win32" ? `${name}.exe` : name;

  if (process.env.PG_BIN_DIR) {
    const candidate = join(process.env.PG_BIN_DIR, exeName);
    if (existsSync(candidate)) return candidate;
  }

  const inPath = spawnSync(name, ["--version"]);
  if (inPath.status === 0) return name;

  if (process.platform === "win32") {
    const pgRoot = "C:\\Program Files\\PostgreSQL";
    if (existsSync(pgRoot)) {
      const versions = readdirSync(pgRoot).sort().reverse();
      for (const version of versions) {
        const candidate = join(pgRoot, version, "bin", exeName);
        if (existsSync(candidate)) return candidate;
      }
    }
  }

  throw new Error(
    `No se encontró "${name}". Instala el cliente de PostgreSQL o define ` +
    `PG_BIN_DIR apuntando a la carpeta bin (ej. C:\\Program Files\\PostgreSQL\\18\\bin).`
  );
}
