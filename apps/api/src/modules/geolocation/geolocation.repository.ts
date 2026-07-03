import crypto from "node:crypto";
import type { Pool } from "mysql2/promise";
import { pool } from "../../db/connection.js";
import type {
  BuildingGeofenceRow,
  CalibrationPointRow,
  CalibrationProfileRow,
  GeofenceVertex,
} from "./geolocation.types.js";

export class GeolocationRepository {
  constructor(private readonly db: Pool = pool) {}

  async findActiveCalibrationProfile(): Promise<CalibrationProfileRow | null> {
    const [rows] = await this.db.query<CalibrationProfileRow[]>(
      `SELECT * FROM campus_calibration_profiles
       WHERE is_active = TRUE
       ORDER BY created_at DESC
       LIMIT 1`
    );
    return rows[0] ?? null;
  }

  async findCalibrationPoints(): Promise<CalibrationPointRow[]> {
    const [rows] = await this.db.query<CalibrationPointRow[]>(
      `SELECT
         cp.*,
         b.name AS building_name,
         b.code AS building_code
       FROM campus_calibration_points cp
       LEFT JOIN buildings b ON b.id = cp.building_id
       WHERE cp.is_active = TRUE
       ORDER BY cp.created_at DESC`
    );
    return rows;
  }

  async insertCalibrationPoint(input: {
    building_id?: string | null;
    label: string;
    latitude: number;
    longitude: number;
    accuracy_meters?: number | null;
    model_x: number;
    model_z: number;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO campus_calibration_points
        (id, building_id, label, latitude, longitude, accuracy_meters, model_x, model_z)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.building_id ?? null,
        input.label,
        input.latitude,
        input.longitude,
        input.accuracy_meters ?? null,
        input.model_x,
        input.model_z,
      ]
    );
    return id;
  }

  async findCalibrationPointById(id: string): Promise<CalibrationPointRow | null> {
    const [rows] = await this.db.query<CalibrationPointRow[]>(
      `SELECT
         cp.*,
         b.name AS building_name,
         b.code AS building_code
       FROM campus_calibration_points cp
       LEFT JOIN buildings b ON b.id = cp.building_id
       WHERE cp.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async insertCalibrationProfile(input: {
    name: string;
    ref_lat: number;
    ref_lng: number;
    meters_lat: number;
    meters_lng: number;
    a_x: number;
    b_x: number;
    c_x: number;
    a_z: number;
    b_z: number;
    c_z: number;
    max_residual_meters?: number | null;
    avg_residual_meters?: number | null;
    activate: boolean;
  }): Promise<string> {
    const id = crypto.randomUUID();
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      if (input.activate) {
        await connection.query(
          "UPDATE campus_calibration_profiles SET is_active = FALSE WHERE is_active = TRUE"
        );
      }
      await connection.query(
        `INSERT INTO campus_calibration_profiles
          (id, name, ref_lat, ref_lng, meters_lat, meters_lng,
           a_x, b_x, c_x, a_z, b_z, c_z,
           max_residual_meters, avg_residual_meters, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.ref_lat,
          input.ref_lng,
          input.meters_lat,
          input.meters_lng,
          input.a_x,
          input.b_x,
          input.c_x,
          input.a_z,
          input.b_z,
          input.c_z,
          input.max_residual_meters ?? null,
          input.avg_residual_meters ?? null,
          input.activate,
        ]
      );
      await connection.commit();
      return id;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findCalibrationProfileById(id: string): Promise<CalibrationProfileRow | null> {
    const [rows] = await this.db.query<CalibrationProfileRow[]>(
      "SELECT * FROM campus_calibration_profiles WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] ?? null;
  }

  async findActiveGeofences(): Promise<BuildingGeofenceRow[]> {
    const [rows] = await this.db.query<BuildingGeofenceRow[]>(
      `SELECT
         bg.*,
         b.name AS building_name,
         b.code AS building_code
       FROM building_geofences bg
       INNER JOIN buildings b ON b.id = bg.building_id
       WHERE bg.is_active = TRUE
       ORDER BY bg.priority DESC, b.name ASC`
    );
    return rows;
  }

  async insertBuildingGeofence(input: {
    building_id: string;
    name?: string | null;
    polygon: GeofenceVertex[];
    priority: number;
  }): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.query(
      `INSERT INTO building_geofences
        (id, building_id, name, polygon, priority)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        input.building_id,
        input.name ?? null,
        JSON.stringify(input.polygon),
        input.priority,
      ]
    );
    return id;
  }

  async findGeofenceById(id: string): Promise<BuildingGeofenceRow | null> {
    const [rows] = await this.db.query<BuildingGeofenceRow[]>(
      `SELECT
         bg.*,
         b.name AS building_name,
         b.code AS building_code
       FROM building_geofences bg
       INNER JOIN buildings b ON b.id = bg.building_id
       WHERE bg.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }
}
