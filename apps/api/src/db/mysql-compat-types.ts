// El código de repositorios se escribió contra los tipos de mysql2/promise
// (`Pool`, `RowDataPacket`, `ResultSetHeader`). Ahora que la BD es
// PostgreSQL vía `pg`, este módulo ofrece los mismos nombres apuntando a
// nuestro adaptador (ver connection.ts), así los ~20 archivos que hacían
// `import type { ... } from "mysql2/promise"` solo cambian el origen del
// import, no el código que lo usa.
import type { PgPoolAdapter } from "./connection.js";

export type Pool = PgPoolAdapter;

export interface RowDataPacket {
  [column: string]: unknown;
}

export interface ResultSetHeader {
  affectedRows: number;
}
