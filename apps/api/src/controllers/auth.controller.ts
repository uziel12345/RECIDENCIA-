import type { Request, Response } from "express";
import { loginAdmin } from "../modules/auth/auth.service.js";

type LoginRequestBody = {
  usernameOrEmail?: string;
  username?: string;
  email?: string;
  password?: string;
};

function getUsernameOrEmail(body: LoginRequestBody): string {
  return String(body.usernameOrEmail ?? body.username ?? body.email ?? "").trim();
}

export async function loginController(req: Request, res: Response) {
  try {
    const body = req.body as LoginRequestBody;

    const usernameOrEmail = getUsernameOrEmail(body);
    const password = String(body.password ?? "");

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