import bcrypt from "bcryptjs";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { pool } from "../../db/connection.js";
import { env } from "../../config/env.js";
import type { CreateAdminUserInput } from "./auth.schema.js";
import { InvalidCredentialsError } from "./auth.errors.js";

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
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

// Hash de referencia para mantener tiempo constante cuando el usuario no existe
// (previene enumeración de usuarios por diferencia de tiempo en bcrypt)
const TIMING_DUMMY_HASH =
  "$2b$12$oAB3aeF4Z3TqeIJmGhS/O.bEq98xSshN8jTlO.RCv4W3OKq4vcvwW";
const TIMING_DUMMY_ARGON2_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$dyjjjupiWuL2AD5j0hSzQg$3n/hT87Z6RL9tAFsJgT0b7Rb+IiOUc6EQGQzbTkcK98";

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
    tv: tokenVersion,
  };

  const options: SignOptions = {
    algorithm: "HS256",
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
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
    throw new InvalidCredentialsError();
  }

  const adminUser = await findAdminUserByUsernameOrEmail(usernameOrEmail);

  // Ejecutar ambos algoritmos evita que la migración gradual revele si una
  // cuenta existe o qué esquema de hash utiliza por una diferencia de tiempo.
  const storedHash = adminUser?.password_hash ?? "";
  const isArgon2 = storedHash.startsWith("$argon2id$");
  const isBcrypt = storedHash.startsWith("$2");
  const [bcryptMatches, argon2Matches] = await Promise.all([
    bcrypt.compare(input.password, isBcrypt ? storedHash : TIMING_DUMMY_HASH),
    argon2.verify(isArgon2 ? storedHash : TIMING_DUMMY_ARGON2_HASH, input.password),
  ]);
  const passwordMatches = isArgon2 ? argon2Matches : isBcrypt && bcryptMatches;

  if (!adminUser || !adminUser.is_active) {
    throw new InvalidCredentialsError();
  }

  if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
    throw new InvalidCredentialsError();
  }

  if (!passwordMatches) {
    await onLoginFailure(adminUser.id);
    throw new InvalidCredentialsError();
  }

  if (isBcrypt) {
    const upgradedHash = await argon2.hash(input.password, ARGON2_OPTIONS);
    await pool.query("UPDATE admin_users SET password_hash = ? WHERE id = ?", [
      upgradedHash,
      adminUser.id,
    ]);
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
  const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);

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
  const passwordHash = await argon2.hash(newPassword, ARGON2_OPTIONS);

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
