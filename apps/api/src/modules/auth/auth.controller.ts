import type { NextFunction, Request, Response } from "express";
import { createCsrfToken } from "../../shared/middlewares/csrf.middleware.js";
import {
  createAdminUser,
  invalidateAdminToken,
  listAdminUsers,
  loginAdmin,
  resetAdminUserPassword,
  updateAdminUserStatus,
} from "./auth.service.js";
import type {
  CreateAdminUserInput,
  LoginInput,
  ResetAdminUserPasswordInput,
} from "./auth.schema.js";
import { auditLog } from "../../shared/services/audit.service.js";
import { InvalidCredentialsError } from "./auth.errors.js";

const SESSION_COOKIE = "admin_session";
const CSRF_COOKIE = "csrf_token";
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000;

const cookieBase = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: COOKIE_MAX_AGE,
  path: "/",
};

export async function loginController(
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { usernameOrEmail, password } = req.body;

    const result = await loginAdmin({ usernameOrEmail, password });
    const csrfToken = createCsrfToken(process.env.CSRF_SECRET ?? process.env.JWT_SECRET ?? "");

    res.cookie(SESSION_COOKIE, result.token, { ...cookieBase, httpOnly: true });
    res.cookie(CSRF_COOKIE, csrfToken, { ...cookieBase, httpOnly: false });

    auditLog({ req, action: "LOGIN_SUCCESS", userId: result.user.id });

    return res.status(200).json({
      success: true,
      data: { user: result.user },
    });
  } catch (error) {
    auditLog({
      req,
      action: "LOGIN_FAILURE",
      details: { identifier_provided: Boolean(req.body?.usernameOrEmail) },
    });

    if (!(error instanceof InvalidCredentialsError)) {
      next(error);
      return;
    }

    return res.status(401).json({
      success: false,
      message: "Credenciales inválidas",
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

  auditLog({
    req,
    action: "CREATE_ADMIN_USER",
    userId: req.authUser?.id,
    resourceType: "admin_user",
    resourceId: user.id,
    details: { username: user.username, role: user.role },
  });

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

  auditLog({
    req,
    action: "UPDATE_ADMIN_USER_STATUS",
    userId: req.authUser?.id,
    resourceType: "admin_user",
    resourceId: user.id,
    details: { is_active: user.is_active },
  });

  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
}

export async function resetAdminUserPasswordController(
  req: Request,
  res: Response
) {
  const id = String(req.params.id);
  const { password } = req.body as ResetAdminUserPasswordInput;
  const user = await resetAdminUserPassword(id, password);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Usuario administrador no encontrado",
    });
  }

  auditLog({
    req,
    action: "RESET_ADMIN_USER_PASSWORD",
    userId: req.authUser?.id,
    resourceType: "admin_user",
    resourceId: user.id,
  });

  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
}
