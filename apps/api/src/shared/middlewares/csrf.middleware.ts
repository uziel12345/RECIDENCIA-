import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function createCsrfToken(secret: string): string {
  const nonce = randomBytes(16).toString("hex");
  const mac = createHmac("sha256", secret).update(nonce).digest("hex");
  return `${nonce}.${mac}`;
}

function verifyCsrfSignature(token: string, secret: string): boolean {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const nonce = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  try {
    const expected = createHmac("sha256", secret).update(nonce).digest("hex");
    if (provided.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const tokenFromHeader = req.headers["x-csrf-token"] as string | undefined;
  const tokenFromCookie = req.cookies?.csrf_token as string | undefined;
  const secret = process.env.JWT_SECRET ?? "";

  if (
    !tokenFromCookie ||
    !tokenFromHeader ||
    !secret ||
    tokenFromHeader !== tokenFromCookie ||
    !verifyCsrfSignature(tokenFromCookie, secret)
  ) {
    return res.status(403).json({
      success: false,
      message: "Token CSRF inválido o faltante",
    });
  }

  return next();
}
