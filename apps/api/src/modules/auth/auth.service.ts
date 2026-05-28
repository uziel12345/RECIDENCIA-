import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { AuthUser, UserRole } from "@ito-map/shared";
import { pool } from "../../db/connection.js";
import type { CreateAdminUserInput } from "./auth.schema.js";

export type LoginInput = {
  usernameOrEmail: string;
  password: string;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
};

type AdminUserRow = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: number | boolean;
};

type JwtPayload = {
  sub: string;
  username: string;
  email: string;
  role: UserRole;
};

function getJwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET no está configurado en el archivo .env");
  }

  return secret;
}

function getJwtExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_EXPIRES_IN || "8h") as SignOptions["expiresIn"];
}

function mapAdminUserToAuthUser(row: AdminUserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    is_active: Boolean(row.is_active),
  };
}

function signAuthToken(user: AuthUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: getJwtExpiresIn(),
  };

  return jwt.sign(payload, getJwtSecret(), options);
}

async function findAdminUserByUsernameOrEmail(
  usernameOrEmail: string
): Promise<AdminUserRow | null> {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        username,
        full_name,
        email,
        password_hash,
        role,
        is_active
      FROM admin_users
      WHERE username = ? OR email = ?
      LIMIT 1
    `,
    [usernameOrEmail, usernameOrEmail]
  );

  const users = rows as AdminUserRow[];

  return users[0] ?? null;
}

async function updateLastLoginAt(userId: string): Promise<void> {
  await pool.query(
    `
      UPDATE admin_users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [userId]
  );
}

export async function loginAdmin(input: LoginInput): Promise<LoginResult> {
  const usernameOrEmail = input.usernameOrEmail.trim();

  if (!usernameOrEmail || !input.password) {
    throw new Error("Usuario/correo y contraseña son obligatorios");
  }

  const adminUser = await findAdminUserByUsernameOrEmail(usernameOrEmail);

  if (!adminUser) {
    throw new Error("Credenciales inválidas");
  }

  if (!Boolean(adminUser.is_active)) {
    throw new Error("El usuario administrador está inactivo");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    adminUser.password_hash
  );

  if (!passwordMatches) {
    throw new Error("Credenciales inválidas");
  }

  const user = mapAdminUserToAuthUser(adminUser);
  const token = signAuthToken(user);

  await updateLastLoginAt(user.id);

  return {
    token,
    user,
  };
}

export async function listAdminUsers(): Promise<AuthUser[]> {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        username,
        full_name,
        email,
        role,
        is_active
      FROM admin_users
      ORDER BY username ASC
    `
  );

  return (rows as AdminUserRow[]).map(mapAdminUserToAuthUser);
}

export async function createAdminUser(
  input: CreateAdminUserInput
): Promise<AuthUser> {
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 12);

  await pool.query(
    `
      INSERT INTO admin_users (
        id,
        username,
        full_name,
        email,
        password_hash,
        role,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      input.username.trim(),
      input.full_name.trim(),
      input.email.trim(),
      passwordHash,
      input.role,
      input.is_active,
    ]
  );

  const [rows] = await pool.query(
    `
      SELECT
        id,
        username,
        full_name,
        email,
        password_hash,
        role,
        is_active
      FROM admin_users
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return mapAdminUserToAuthUser((rows as AdminUserRow[])[0]);
}

export async function updateAdminUserStatus(
  userId: string,
  isActive: boolean
): Promise<AuthUser | null> {
  await pool.query(
    `
      UPDATE admin_users
      SET is_active = ?
      WHERE id = ?
    `,
    [isActive, userId]
  );

  const [rows] = await pool.query(
    `
      SELECT
        id,
        username,
        full_name,
        email,
        password_hash,
        role,
        is_active
      FROM admin_users
      WHERE id = ?
      LIMIT 1
    `,
    [userId]
  );

  const users = rows as AdminUserRow[];
  return users[0] ? mapAdminUserToAuthUser(users[0]) : null;
}
