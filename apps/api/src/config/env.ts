import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET_MIN_LENGTH = 32;

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

export const env = {
  port: Number(process.env.PORT ?? 3001),
  dbHost: requireEnv("DB_HOST"),
  dbPort: Number(process.env.DB_PORT ?? 3306),
  dbUser: requireEnv("DB_USER"),
  dbPassword: requireEnv("DB_PASSWORD"),
  dbName: requireEnv("DB_NAME"),
  jwtSecret: requireSecureSecret("JWT_SECRET"),
  // Separate secret for CSRF so a JWT_SECRET leak doesn't also compromise CSRF tokens.
  // Falls back to JWT_SECRET for backward-compat with existing deployments.
  csrfSecret: process.env.CSRF_SECRET
    ? requireSecureSecret("CSRF_SECRET")
    : requireSecureSecret("JWT_SECRET"),
  jwtExpiresIn: requireEnv("JWT_EXPIRES_IN"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};