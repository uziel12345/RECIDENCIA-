import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const requiredArtifacts = [
  new URL("../dist/server.js", import.meta.url),
  new URL("../../web/dist/index.html", import.meta.url),
];

for (const artifact of requiredArtifacts) {
  try {
    await access(artifact);
  } catch {
    console.error(
      `Falta el archivo de produccion ${fileURLToPath(artifact)}. Ejecuta \"pnpm build\" antes de iniciar.`
    );
    process.exit(1);
  }
}

process.env.NODE_ENV = "production";

await import("../dist/server.js");
