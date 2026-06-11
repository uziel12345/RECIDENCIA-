import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import { csrfProtection } from "./shared/middlewares/csrf.middleware.js";
import { notFoundHandler } from "./shared/middlewares/not-found.js";
import { errorHandler } from "./shared/middlewares/error-handler.js";
import { env } from "./config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiPackageDir = path.resolve(__dirname, "..");
const webDist = path.resolve(__dirname, "../../web/dist");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = env.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "'wasm-unsafe-eval'"],
      },
    },
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Demasiadas solicitudes. Intenta nuevamente en un momento.",
    },
  })
);

app.use("/uploads", express.static(path.resolve(apiPackageDir, "uploads")));

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_SKIP_PATHS = new Set(["/auth/login"]);

app.use("/api", (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method) || CSRF_SKIP_PATHS.has(req.path)) {
    return next();
  }
  return csrfProtection(req, res, next);
});

app.use("/api", routes);

app.use(express.static(webDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(path.join(webDist, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
