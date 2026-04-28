import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { notFoundHandler } from "./shared/middlewares/not-found.js";
import { errorHandler } from "./shared/middlewares/error-handler.js";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;