import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { ResultSetHeader } from "mysql2";
import { pool } from "../../db/connection.js";
import { ApiError } from "../../shared/errors/api-error.js";
import type { UserRole } from "../auth/auth.service.js";
import type {
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from "./admin-users.schemas.js";

export type AdminUser = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
};

type AdminUserRow = AdminUser & {
  is_active: number | boolean;
};

function mapAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    is_active: Boolean(row.is_active),
  };
}

export class AdminUsersService {
  async getAll(): Promise<AdminUser[]> {
    const [rows] = await pool.query(
      `
        SELECT id, username, full_name, email, role, is_active
        FROM admin_users
        ORDER BY full_name ASC, username ASC
      `
    );

    return (rows as AdminUserRow[]).map(mapAdminUser);
  }

  async getById(id: string): Promise<AdminUser> {
    const [rows] = await pool.query(
      `
        SELECT id, username, full_name, email, role, is_active
        FROM admin_users
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    const user = (rows as AdminUserRow[])[0];

    if (!user) {
      throw new ApiError(404, "Usuario administrador no encontrado");
    }

    return mapAdminUser(user);
  }

  async create(input: CreateAdminUserInput): Promise<AdminUser> {
    const username = input.username.trim();
    const fullName = input.full_name.trim();
    const email = input.email.trim().toLowerCase();

    await this.ensureUnique(username, email);

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 10);

    await pool.query(
      `
        INSERT INTO admin_users
          (id, username, full_name, email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        username,
        fullName,
        email,
        passwordHash,
        input.role,
        input.is_active,
      ]
    );

    return this.getById(id);
  }

  async update(id: string, input: UpdateAdminUserInput): Promise<AdminUser> {
    await this.getById(id);

    const username = input.username?.trim();
    const email = input.email?.trim().toLowerCase();

    await this.ensureUnique(username, email, id);

    const fields: string[] = [];
    const values: unknown[] = [];

    if (username !== undefined) {
      fields.push("username = ?");
      values.push(username);
    }

    if (input.full_name !== undefined) {
      fields.push("full_name = ?");
      values.push(input.full_name.trim());
    }

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }

    if (input.password !== undefined) {
      fields.push("password_hash = ?");
      values.push(await bcrypt.hash(input.password, 10));
    }

    if (input.role !== undefined) {
      fields.push("role = ?");
      values.push(input.role);
    }

    if (input.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(input.is_active);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);

    await pool.query(
      `
        UPDATE admin_users
        SET ${fields.join(", ")}
        WHERE id = ?
      `,
      values
    );

    return this.getById(id);
  }

  async updateStatus(id: string, isActive: boolean): Promise<AdminUser> {
    const [result] = await pool.query<ResultSetHeader>(
      `
        UPDATE admin_users
        SET is_active = ?
        WHERE id = ?
      `,
      [isActive, id]
    );

    if (result.affectedRows === 0) {
      throw new ApiError(404, "Usuario administrador no encontrado");
    }

    return this.getById(id);
  }

  private async ensureUnique(
    username?: string,
    email?: string,
    excludeId?: string
  ): Promise<void> {
    if (!username && !email) return;

    const values: unknown[] = [username ?? "", email ?? ""];
    let query = `
      SELECT id, username, email
      FROM admin_users
      WHERE (username = ? OR email = ?)
    `;

    if (excludeId) {
      query += " AND id <> ?";
      values.push(excludeId);
    }

    query += " LIMIT 1";

    const [rows] = await pool.query(query, values);
    const duplicate = (rows as Array<{ username: string; email: string }>)[0];

    if (!duplicate) return;

    if (username && duplicate.username === username) {
      throw new ApiError(409, "El nombre de usuario ya esta en uso");
    }

    throw new ApiError(409, "El correo electronico ya esta en uso");
  }
}
