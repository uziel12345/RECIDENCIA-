import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/connection.js";

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
  // Log but don't exit — fire-and-forget tasks (audit logging) should not crash the server.
});

process.on("uncaughtException", (error) => {
  console.error("[uncaughtException]", error);
  process.exit(1);
});

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log("Base de datos conectada correctamente");
    connection.release();

    app.listen(env.port, () => {
      console.log(`API ejecutándose en http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar la API:", error);
    process.exit(1);
  }
}

startServer();