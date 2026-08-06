import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../../../db/connection.js";
import { env } from "../../../config/env.js";
import type { AuthUser, UserRole } from "../auth.service.js";

type JwtPayload = {
  sub: string;
  tv: number; // token_version
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
  token_version: number;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.admin_session as string | undefined;
  if (cookieToken) return cookieToken;

  const authorization = req.headers.authorization;
  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

async function findAdminRowById(userId: string): Promise<AdminUserRow | null> {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        username,
        full_name,
        email,
        role,
        is_active,
        token_version
      FROM admin_users
      WHERE id = ?
      LIMIT 1
    `,
    [userId]
  );

  const users = rows as AdminUserRow[];
  return users[0] ?? null;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticación requerido",
      });
    }

    const payload = jwt.verify(token, env.jwtSecret, {
      algorithms: ["HS256"],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    }) as JwtPayload;

    if (typeof payload.sub !== "string" || !Number.isInteger(payload.tv)) {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    const row = await findAdminRowById(payload.sub);

    if (!row || !row.is_active) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autorizado o inactivo",
      });
    }

    if (payload.tv !== row.token_version) {
      return res.status(401).json({
        success: false,
        message: "Sesión revocada. Inicia sesión nuevamente.",
      });
    }

    req.authUser = {
      id: row.id,
      username: row.username,
      full_name: row.full_name,
      email: row.email,
      role: row.role,
      is_active: Boolean(row.is_active),
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
}
