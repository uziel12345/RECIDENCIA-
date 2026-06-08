import mysql from "mysql2/promise";

let _pool: mysql.Pool | undefined;

export function getPool(): mysql.Pool {
  if (_pool) return _pool;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (!host) throw new Error("Falta la variable de entorno: DB_HOST");
  if (!user) throw new Error("Falta la variable de entorno: DB_USER");
  if (!password) throw new Error("Falta la variable de entorno: DB_PASSWORD");
  if (!dbName) throw new Error("Falta la variable de entorno: DB_NAME");

  _pool = mysql.createPool({
    host,
    port: Number(process.env.DB_PORT ?? 3306),
    user,
    password,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return _pool;
}

// Pool con inicialización perezosa: env vars no se leen hasta la primera consulta.
// Si getPool() lanza (vars faltantes), las propiedades de tipo función devuelven
// una Promise rechazada en lugar de lanzar síncronamente, para que auditLog
// (fire-and-forget con .catch) siga funcionando correctamente sin BD.
export const pool: mysql.Pool = new Proxy({} as mysql.Pool, {
  get(_target, prop, receiver) {
    try {
      return Reflect.get(getPool(), prop, receiver);
    } catch (err) {
      // Para métodos como .query() y .execute(), devolver una función que rechaza.
      // Esto permite que pool.query(...).catch(() => undefined) funcione sin BD.
      if (typeof prop === "string") {
        return (..._args: unknown[]) => Promise.reject(err);
      }
      throw err;
    }
  },
});
