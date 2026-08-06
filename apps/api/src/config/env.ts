import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET_MIN_LENGTH = 32;

function readInteger(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} debe ser un entero entre ${min} y ${max}`);
  }

  return value;
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Falta la variable de entorno: ${name}`);
  }

  return value;
}

function requireSecureSecret(name: string): string {
  const value = requireEnv(name);

  if (value.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `${name} debe tener al menos ${JWT_SECRET_MIN_LENGTH} caracteres. ` +
      `Longitud actual: ${value.length}. ` +
      `Genera un secreto seguro con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }

  return value;
}

function readJwtLifetime(): string {
  const value = requireEnv("JWT_EXPIRES_IN");
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error("JWT_EXPIRES_IN debe usar un formato como 30m, 2h u 8h");

  const amount = Number(match[1]);
  const multiplier = { s: 1, m: 60, h: 3_600, d: 86_400 }[match[2] as "s" | "m" | "h" | "d"];
  const seconds = amount * multiplier;
  if (seconds < 300 || seconds > 28_800) {
    throw new Error("JWT_EXPIRES_IN debe estar entre 5 minutos y 8 horas");
  }
  return value;
}

function readCorsOrigins(): string {
  const value = process.env.CORS_ORIGIN ?? "http://localhost:5173";
  const origins = value.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0 || origins.includes("*")) {
    throw new Error("CORS_ORIGIN debe contener origenes explicitos");
  }
  for (const origin of origins) {
    const url = new URL(origin);
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin) {
      throw new Error(`Origen CORS invalido: ${origin}`);
    }
  }
  return origins.join(",");
}

const nodeEnv = process.env.NODE_ENV ?? "development";

if (nodeEnv === "production" && !process.env.CSRF_SECRET) {
  throw new Error("CSRF_SECRET es obligatoria en produccion y debe ser distinta de JWT_SECRET");
}
if (nodeEnv === "production" && process.env.CSRF_SECRET === process.env.JWT_SECRET) {
  throw new Error("CSRF_SECRET y JWT_SECRET deben ser diferentes en produccion");
}

export const env = {
  nodeEnv,
  port: readInteger("PORT", 3001, 1, 65535),
  host: process.env.HOST ?? "127.0.0.1",
  dbHost: requireEnv("DB_HOST"),
  dbPort: readInteger("DB_PORT", 5432, 1, 65535),
  dbUser: requireEnv("DB_USER"),
  dbPassword: requireEnv("DB_PASSWORD"),
  dbName: requireEnv("DB_NAME"),
  dbPoolMax: readInteger("DB_POOL_MAX", 10, 1, 50),
  dbConnectionTimeoutMs: readInteger("DB_CONNECTION_TIMEOUT_MS", 5_000, 500, 60_000),
  dbIdleTimeoutMs: readInteger("DB_IDLE_TIMEOUT_MS", 30_000, 1_000, 300_000),
  dbStatementTimeoutMs: readInteger("DB_STATEMENT_TIMEOUT_MS", 15_000, 1_000, 120_000),
  dbQueryTimeoutMs: readInteger("DB_QUERY_TIMEOUT_MS", 20_000, 1_000, 180_000),
  jwtSecret: requireSecureSecret("JWT_SECRET"),
  // Separate secret for CSRF so a JWT_SECRET leak doesn't also compromise CSRF tokens.
  // Falls back to JWT_SECRET for backward-compat with existing deployments.
  csrfSecret: process.env.CSRF_SECRET
    ? requireSecureSecret("CSRF_SECRET")
    : requireSecureSecret("JWT_SECRET"),
  jwtExpiresIn: readJwtLifetime(),
  jwtIssuer: process.env.JWT_ISSUER?.trim() || "mapa-ito-api",
  jwtAudience: process.env.JWT_AUDIENCE?.trim() || "mapa-ito-admin",
  corsOrigin: readCorsOrigins(),
};
