import type { Request, Response } from "express";
import { loginAdmin } from "../modules/auth/auth.service.js";
import type { LoginInput } from "../modules/auth/auth.schema.js";

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