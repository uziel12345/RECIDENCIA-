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
        // El hash cubre el <script> inline de index.html que evita el
        // "flash" de tema claro/oscuro al cargar. Si ese script cambia, hay
        // que regenerar el hash (el navegador lo muestra en la violación de
        // CSP en consola) o moverlo a un archivo externo.
        "script-src": [
          "'self'",
          "'wasm-unsafe-eval'",
          "'sha256-HJu1q3MpGURaA3Z9OSbqopCjzUKjIdsF+O8MtlnwCnA='",
        ],
        // El modelo 3D (campus.glb) embebe sus texturas en el binario; Three.js
        // las extrae como Blob y las carga vía fetch() a una blob: URL (cae bajo
        // connect-src, no img-src). El KTX2Loader además arranca su transcoder
        // en un Web Worker creado desde una blob: URL. Sin blob: en estas
        // directivas, el navegador bloquea todo en silencio: el modelo carga
        // pero sin texturas y con mallas (como el piso) sin material.
        "connect-src": ["'self'", "https://api.open-meteo.com", "blob:"],
        "img-src": ["'self'", "data:", "blob:"],
        "worker-src": ["'self'", "blob:"],
        "child-src": ["'self'", "blob:"],
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
app.use(express.json({ limit: "2mb" }));

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

app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

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
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    next();
    return;
  }
  res.sendFile(path.join(webDist, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
