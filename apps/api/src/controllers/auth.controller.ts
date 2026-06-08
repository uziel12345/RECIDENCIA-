import type { Request, Response } from "express";
import { createCsrfToken } from "../shared/middlewares/csrf.middleware.js";
import {
  createAdminUser,
  invalidateAdminToken,
  listAdminUsers,
  loginAdmin,
  updateAdminUserStatus,
} from "../modules/auth/auth.service.js";
import type { CreateAdminUserInput, LoginInput } from "../modules/auth/auth.schema.js";
import { auditLog } from "../shared/services/audit.service.js";

const SESSION_COOKIE = "admin_session";
const CSRF_COOKIE = "csrf_token";
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000;

const cookieBase = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: COOKIE_MAX_AGE,
  path: "/",
};

export async function loginController(req: Request<{}, {}, LoginInput>, res: Response) {
  try {
    const { usernameOrEmail, password } = req.body;

    const result = await loginAdmin({ usernameOrEmail, password });
    const csrfToken = createCsrfToken(process.env.JWT_SECRET ?? "");

    res.cookie(SESSION_COOKIE, result.token, { ...cookieBase, httpOnly: true });
    res.cookie(CSRF_COOKIE, csrfToken, { ...cookieBase, httpOnly: false });

    auditLog({ req, action: "LOGIN_SUCCESS", userId: result.user.id });

    return res.status(200).json({
      success: true,
      data: { user: result.user },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo iniciar sesión";

    auditLog({
      req,
      action: "LOGIN_FAILURE",
      details: { attempted: req.body?.usernameOrEmail },
    });

    return res.status(401).json({
      success: false,
      message,
    });
  }
}

export async function logoutController(req: Request, res: Response) {
  if (req.authUser) {
    await invalidateAdminToken(req.authUser.id);
    auditLog({ req, action: "LOGOUT", userId: req.authUser.id });
  }

  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.clearCookie(CSRF_COOKIE, { path: "/" });

  return res.status(200).json({
    success: true,
    data: { message: "Sesión cerrada correctamente" },
  });
}

export async function meController(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.authUser,
    },
  });
}

export async function listAdminUsersController(_req: Request, res: Response) {
  const users = await listAdminUsers();

  return res.status(200).json({
    success: true,
    data: {
      users,
    },
  });
}

export async function createAdminUserController(
  req: Request<{}, {}, CreateAdminUserInput>,
  res: Response
) {
  const user = await createAdminUser(req.body);

  return res.status(201).json({
    success: true,
    data: {
      user,
    },
  });
}

export async function updateAdminUserStatusController(
  req: Request,
  res: Response
) {
  const id = String(req.params.id);
  const { is_active } = req.body as { is_active: boolean };
  const user = await updateAdminUserStatus(id, is_active);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Usuario administrador no encontrado",
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
}
