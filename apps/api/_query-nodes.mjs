import mysql from 'mysql2/promise';
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const [rows] = await conn.query(
  "SELECT DISTINCT model_node_name FROM buildings WHERE model_node_name IS NOT NULL AND model_node_name != ''"
);
console.log(rows.map(r => r.model_node_name).join('\n'));
await conn.end();
