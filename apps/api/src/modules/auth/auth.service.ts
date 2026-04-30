import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { pool } from "../../db/connection.js";

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