import { spawnSync } from "node:child_process";

const allowedAdvisories = new Map([
  [
    "GHSA-qwww-vcr4-c8h2",
    {
      module: "react-router",
      expires: "2026-10-01",
      reason: "La aplicacion usa BrowserRouter como SPA y no habilita React Server Components ni Server Actions.",
    },
  ],
]);

const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
const args = process.platform === "win32"
  ? ["/d", "/s", "/c", "pnpm audit --prod --json"]
  : ["audit", "--prod", "--json"];
const result = spawnSync(command, args, {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (!result.stdout?.trim()) {
  console.error("pnpm audit no produjo JSON valido.");
  if (result.stderr) console.error(result.stderr.trim());
  process.exit(2);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("No se pudo interpretar la salida de pnpm audit.");
  process.exit(2);
}

const today = new Date().toISOString().slice(0, 10);
const blocking = [];
const accepted = [];

for (const advisory of Object.values(report.advisories ?? {})) {
  if (!advisory || !["high", "critical"].includes(advisory.severity)) continue;
  const ghsa = String(advisory.url ?? "").split("/").at(-1);
  const exception = ghsa ? allowedAdvisories.get(ghsa) : undefined;

  if (
    exception &&
    advisory.module_name === exception.module &&
    today <= exception.expires
  ) {
    accepted.push({ ghsa, severity: advisory.severity, ...exception });
  } else {
    blocking.push({
      ghsa: ghsa ?? advisory.id,
      module: advisory.module_name,
      severity: advisory.severity,
      title: advisory.title,
    });
  }
}

if (accepted.length) {
  console.warn("Riesgos temporales aceptados y documentados:");
  for (const item of accepted) {
    console.warn(`- ${item.ghsa} (${item.module}), vence ${item.expires}: ${item.reason}`);
  }
}

if (blocking.length) {
  console.error("Dependencias de produccion con vulnerabilidades bloqueantes:");
  for (const item of blocking) {
    console.error(`- ${item.severity} ${item.module}: ${item.ghsa} ${item.title}`);
  }
  process.exit(1);
}

console.log("Auditoria de dependencias de produccion: sin hallazgos bloqueantes.");
