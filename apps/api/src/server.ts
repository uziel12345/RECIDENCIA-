import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/connection.js";

function safeProcessError(event: string, value: unknown): void {
  const error = value instanceof Error ? value : new Error("Unknown process error");
  const errorCode = (error as Error & { code?: unknown }).code;
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    event,
    error_name: error.name,
    error_code: typeof errorCode === "string" ? errorCode.slice(0, 80) : undefined,
    error_message: env.nodeEnv === "production"
      ? undefined
      : error.message.replace(/[\r\n\t]/g, " ").slice(0, 500),
  }));
}

process.on("unhandledRejection", (reason) => {
  safeProcessError("unhandled_rejection", reason);
  // Log but don't exit — fire-and-forget tasks (audit logging) should not crash the server.
});

process.on("uncaughtException", (error) => {
  safeProcessError("uncaught_exception", error);
  process.exit(1);
});

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log("Base de datos conectada correctamente");
    connection.release();

    const server = app.listen(env.port, env.host, () => {
      console.log(`API ejecutándose en http://${env.host}:${env.port}`);
    });

    server.headersTimeout = 15_000;
    server.requestTimeout = 120_000;
    server.keepAliveTimeout = 5_000;
    server.maxHeadersCount = 100;

    let shuttingDown = false;
    const shutdown = (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(JSON.stringify({ event: "server_shutdown", signal }));

      const forceExit = setTimeout(() => process.exit(1), 15_000);
      forceExit.unref();
      server.close(async () => {
        try {
          await pool.end();
          process.exit(0);
        } catch (error) {
          safeProcessError("shutdown_error", error);
          process.exit(1);
        }
      });
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    safeProcessError("startup_error", error);
    process.exit(1);
  }
}

startServer();
