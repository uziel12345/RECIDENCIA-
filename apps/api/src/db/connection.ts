import pg from "pg";

// Convierte placeholders estilo mysql2 (`?`) a los `$1, $2, ...` que espera
// pg, sin tocar signos de interrogación dentro de literales de cadena.
function convertPlaceholders(sql: string): string {
  let result = "";
  let index = 0;
  let inSingleQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") {
      inSingleQuote = !inSingleQuote;
      result += ch;
      continue;
    }
    if (ch === "?" && !inSingleQuote) {
      index += 1;
      result += `$${index}`;
      continue;
    }
    result += ch;
  }
  return result;
}

// Todo el código de repositorios/servicios fue escrito contra la API de
// mysql2/promise: `const [rows] = await pool.query(sql, params)` con
// placeholders `?`, y en un par de sitios `pool.getConnection()` +
// `connection.beginTransaction()/commit()/rollback()/release()` para
// transacciones. En vez de tocar los ~21 archivos que usan `pool`, esta capa
// adapta pg para exponer la misma forma, así el resto del código no cambia.
//
// El primer elemento de la tupla que devuelve `query()` es siempre el array
// de filas (`result.rows`), pero con `affectedRows` colgado como propiedad
// extra sobre ese mismo array — cubre tanto `const [rows] = ...` (SELECT)
// como `const [result] = ...; result.affectedRows` (INSERT/UPDATE/DELETE),
// que es como ya lo usa el código existente.
//
// Los call sites llaman a `query<BuildingRow[]>(...)` — T YA es el tipo
// arreglo (igual que en mysql2), así que no hay que volver a envolverlo en
// `T[]` aquí (eso duplicaría el arreglo y rompería el tipado).
type WithAffectedRows<T> = T & { affectedRows: number };

function toQueryResult<T>(result: pg.QueryResult): [WithAffectedRows<T>, pg.FieldDef[]] {
  const rows = result.rows as WithAffectedRows<T>;
  (rows as { affectedRows: number }).affectedRows = result.rowCount ?? 0;
  return [rows, result.fields];
}

class PgConnection {
  constructor(private readonly client: pg.PoolClient) {}

  async query<T = unknown[]>(
    sql: string,
    params?: unknown[]
  ): Promise<[WithAffectedRows<T>, pg.FieldDef[]]> {
    const result = await this.client.query(convertPlaceholders(sql), params);
    return toQueryResult<T>(result);
  }

  async beginTransaction(): Promise<void> {
    await this.client.query("BEGIN");
  }

  async commit(): Promise<void> {
    await this.client.query("COMMIT");
  }

  async rollback(): Promise<void> {
    await this.client.query("ROLLBACK");
  }

  release(): void {
    this.client.release();
  }
}

export class PgPoolAdapter {
  constructor(private readonly pool: pg.Pool) {}

  async query<T = unknown[]>(
    sql: string,
    params?: unknown[]
  ): Promise<[WithAffectedRows<T>, pg.FieldDef[]]> {
    const result = await this.pool.query(convertPlaceholders(sql), params);
    return toQueryResult<T>(result);
  }

  async getConnection(): Promise<PgConnection> {
    const client = await this.pool.connect();
    return new PgConnection(client);
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}

let _pool: PgPoolAdapter | undefined;

export function getPool(): PgPoolAdapter {
  if (_pool) return _pool;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (!host) throw new Error("Falta la variable de entorno: DB_HOST");
  if (!user) throw new Error("Falta la variable de entorno: DB_USER");
  if (!password) throw new Error("Falta la variable de entorno: DB_PASSWORD");
  if (!dbName) throw new Error("Falta la variable de entorno: DB_NAME");

  const rawPool = new pg.Pool({
    host,
    port: Number(process.env.DB_PORT ?? 5432),
    user,
    password,
    database: dbName,
    max: 10,
  });

  _pool = new PgPoolAdapter(rawPool);
  return _pool;
}

// Pool con inicialización perezosa: env vars no se leen hasta la primera consulta.
// Si getPool() lanza (vars faltantes), las propiedades de tipo función devuelven
// una Promise rechazada en lugar de lanzar síncronamente, para que auditLog
// (fire-and-forget con .catch) siga funcionando correctamente sin BD.
export const pool: PgPoolAdapter = new Proxy({} as PgPoolAdapter, {
  get(_target, prop, receiver) {
    try {
      return Reflect.get(getPool(), prop, receiver);
    } catch (err) {
      // Para métodos como .query() y .getConnection(), devolver una función
      // que rechaza. Esto permite que pool.query(...).catch(() => undefined)
      // funcione sin BD.
      if (typeof prop === "string") {
        return (..._args: unknown[]) => Promise.reject(err);
      }
      throw err;
    }
  },
});
