import type { Request, Response } from "express";
import { pool } from "../db/connection.js";

export async function getHealth(_req: Request, res: Response) {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");

    res.status(200).json({
      success: true,
      message: "API funcionando correctamente",
      database: rows,
    });
  } catch (error) {
    console.error("Error en health check:", error);

    res.status(500).json({
      success: false,
      message: "Error de conexión con la base de datos",
    });
  }
}