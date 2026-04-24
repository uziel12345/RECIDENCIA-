import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Falta la variable de entorno: ${name}`);
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
};