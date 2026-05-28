import type { Request, Response } from "express";
import {
  createAdminUser,
  listAdminUsers,
  loginAdmin,
  updateAdminUserStatus,
} from "../modules/auth/auth.service.js";
import type { CreateAdminUserInput, LoginInput } from "../modules/auth/auth.schema.js";

export async function loginController(req: Request<{}, {}, LoginInput>, res: Response) {
  try {
    const { usernameOrEmail, password } = req.body;

    const result = await loginAdmin({
      usernameOrEmail,
      password,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo iniciar sesión";

    return res.status(401).json({
      success: false,
      message,
    });
  }
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
