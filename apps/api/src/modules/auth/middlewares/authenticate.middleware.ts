import type { NextFunction, Request, Response } from "express";
import jwt, { type Secret } from "jsonwebtoken";
import { pool } from "../../../db/connection.js";
import type { AuthUser, UserRole } from "../auth.service.js";

type JwtPayload = {
  sub: string;
  username: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};

type AdminUserRow = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: number | boolean;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

function getJwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET no está configurado en el archivo .env");
  }

  return secret;
}

function extractBearerToken(req: Request): string | null {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function findActiveAdminById(userId: string): Promise<AuthUser | null> {
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
      WHERE id = ?
      LIMIT 1
    `,
    [userId]
  );

  const users = rows as AdminUserRow[];
  const user = users[0];

  if (!user || !Boolean(user.is_active)) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    is_active: Boolean(user.is_active),
  };
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticación requerido",
      });
    }

    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    const user = await findActiveAdminById(payload.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autorizado o inactivo",
      });
    }

    req.authUser = user;

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
}