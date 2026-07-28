import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { pool } from "../../db/connection.js";
import { env } from "../../config/env.js";
import type { CreateAdminUserInput } from "./auth.schema.js";

export type UserRole =
  | "superadmin"
  | "admin"
  | "servicios_escolares"
  | "recursos_humanos"
  | "viewer";

export type AuthUser = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
};

export type LoginInput = {
  usernameOrEmail: string;
  password: string;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

// Hash de referencia para mantener tiempo constante cuando el usuario no existe
// (previene enumeración de usuarios por diferencia de tiempo en bcrypt)
const TIMING_DUMMY_HASH =
  "$2b$12$oAB3aeF4Z3TqeIJmGhS/O.bEq98xSshN8jTlO.RCv4W3OKq4vcvwW";

type AdminUserRow = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: number | boolean;
  failed_login_attempts: number;
  locked_until: Date | string | null;
  token_version: number;
};

type JwtPayload = {
  sub: string;
  username: string;
  email: string;
  role: UserRole;
  tv: number; // token_version
};

function getJwtExpiresIn(): SignOptions["expiresIn"] {
  return env.jwtExpiresIn as SignOptions["expiresIn"];
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

function signAuthToken(user: AuthUser, tokenVersion: number): string {
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    tv: tokenVersion,
  };

  const options: SignOptions = {
    expiresIn: getJwtExpiresIn(),
  };

  return jwt.sign(payload, env.jwtSecret, options);
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
        is_active,
        failed_login_attempts,
        locked_until,
        token_version
      FROM admin_users
      WHERE username = ? OR email = ?
      LIMIT 1
    `,
    [usernameOrEmail, usernameOrEmail]
  );

  const users = rows as AdminUserRow[];

  return users[0] ?? null;
}

async function onLoginSuccess(userId: string): Promise<void> {
  await pool.query(
    `
      UPDATE admin_users
      SET failed_login_attempts = 0,
          locked_until = NULL,
          last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [userId]
  );
}

export async function invalidateAdminToken(userId: string): Promise<void> {
  await pool.query(
    `UPDATE admin_users SET token_version = token_version + 1 WHERE id = ?`,
    [userId]
  );
}

async function onLoginFailure(userId: string): Promise<void> {
  await pool.query(
    `
      UPDATE admin_users
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE
            WHEN failed_login_attempts + 1 >= ?
            THEN NOW() + make_interval(mins => ?)
            ELSE NULL
          END
      WHERE id = ?
    `,
    [MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES, userId]
  );
}

export async function loginAdmin(input: LoginInput): Promise<LoginResult> {
  const usernameOrEmail = input.usernameOrEmail.trim();

  if (!usernameOrEmail || !input.password) {
    throw new Error("Usuario/correo y contraseña son obligatorios");
  }

  const adminUser = await findAdminUserByUsernameOrEmail(usernameOrEmail);

  // Siempre ejecutar bcrypt para evitar enumeración de usuarios por timing
  const hashToCompare = adminUser?.password_hash ?? TIMING_DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(input.password, hashToCompare);

  if (!adminUser || !Boolean(adminUser.is_active)) {
    throw new Error("Credenciales inválidas");
  }

  if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(adminUser.locked_until).getTime() - Date.now()) / 60_000
    );
    throw new Error(
      `Cuenta bloqueada por demasiados intentos fallidos. Intenta en ${minutesLeft} minuto${minutesLeft === 1 ? "" : "s"}.`
    );
  }

  if (!passwordMatches) {
    await onLoginFailure(adminUser.id);
    throw new Error("Credenciales inválidas");
  }

  const user = mapAdminUserToAuthUser(adminUser);
  const token = signAuthToken(user, adminUser.token_version);

  await onLoginSuccess(user.id);

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

export async function resetAdminUserPassword(
  userId: string,
  newPassword: string
): Promise<AuthUser | null> {
  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.query(
    `
      UPDATE admin_users
      SET password_hash = ?,
          token_version = token_version + 1,
          failed_login_attempts = 0,
          locked_until = NULL
      WHERE id = ?
    `,
    [passwordHash, userId]
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
