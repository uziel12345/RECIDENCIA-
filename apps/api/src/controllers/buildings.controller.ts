import type { Request, Response } from "express";
import { pool } from "../db/connection.js";

export async function getBuildings(_req: Request, res: Response) {
  try {
    const [rows] = await pool.query(`
      SELECT
        b.id,
        b.code,
        b.name,
        b.slug,
        b.description,
        b.model_node_name,
        b.x,
        b.y,
        b.z,
        b.latitude,
        b.longitude,
        b.is_active,
        b.is_priority,
        bc.code AS category_code,
        bc.name AS category_name,
        bc.color_hex AS category_color
      FROM buildings b
      INNER JOIN building_categories bc ON b.category_id = bc.id
      WHERE b.is_active = TRUE
      ORDER BY b.name ASC
    `);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error al obtener edificios:", error);

    res.status(500).json({
      success: false,
      message: "No se pudieron obtener los edificios",
    });
  }
}

export async function getBuildingById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        b.id,
        b.code,
        b.name,
        b.slug,
        b.description,
        b.model_node_name,
        b.x,
        b.y,
        b.z,
        b.latitude,
        b.longitude,
        b.is_active,
        b.is_priority,
        bc.code AS category_code,
        bc.name AS category_name,
        bc.color_hex AS category_color
      FROM buildings b
      INNER JOIN building_categories bc ON b.category_id = bc.id
      WHERE b.id = ?
      LIMIT 1
      `,
      [id]
    );

    const data = rows as any[];

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Edificio no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error("Error al obtener edificio:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudo obtener el edificio",
    });
  }
}

export async function getBuildingImages(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        bi.id,
        bi.image_url,
        bi.image_type,
        bi.title,
        bi.description,
        bi.is_cover,
        bi.sort_order,
        bi.is_active
      FROM building_images bi
      WHERE bi.building_id = ? AND bi.is_active = TRUE
      ORDER BY bi.sort_order ASC, bi.created_at ASC
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error al obtener imágenes del edificio:", error);

    res.status(500).json({
      success: false,
      message: "No se pudieron obtener las imágenes del edificio",
    });
  }
}