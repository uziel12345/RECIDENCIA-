import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "./authenticate.middleware.js";
import { pool } from "../../../db/connection.js";

vi.mock("jsonwebtoken", () => ({
  default: { verify: vi.fn() },
}));

vi.mock("../../../db/connection.js", () => ({
  pool: { query: vi.fn() },
}));

vi.mock("../../../config/env.js", () => ({
  env: { jwtSecret: "test-secret-that-is-at-least-32chars-long!!" },
}));

// Must match the literal in the vi.mock factory above
const TEST_SECRET = "test-secret-that-is-at-least-32chars-long!!";

const mockedJwtVerify = vi.mocked(jwt.verify);
const mockedPoolQuery = vi.mocked(pool.query);

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function createMockRequest(opts: {
  headers?: Request["headers"];
  cookies?: Record<string, string>;
} = {}): Request {
  return {
    headers: opts.headers ?? {},
    cookies: opts.cookies ?? {},
  } as unknown as Request;
}

const validPayload = {
  sub: "user-1",
  username: "admin",
  email: "admin@example.com",
  role: "admin",
  tv: 2,
};

const activeUserRow = [
  {
    id: "user-1",
    username: "admin",
    full_name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    is_active: 1,
    token_version: 2,
  },
];

describe("authenticate middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Token extraction ───────────────────────────────────────────────────────

  it("returns 401 when no token is present (no header, no cookie)", async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token de autenticación requerido",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is not Bearer", async () => {
    const req = createMockRequest({ headers: { authorization: "Basic token" } });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts token from Bearer header", async () => {
    mockedJwtVerify.mockReturnValue(validPayload as any);
    mockedPoolQuery.mockResolvedValue([activeUserRow, []] as any);

    const req = createMockRequest({ headers: { authorization: "Bearer valid-token" } });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(mockedJwtVerify).toHaveBeenCalledWith("valid-token", TEST_SECRET);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("accepts token from admin_session cookie", async () => {
    mockedJwtVerify.mockReturnValue(validPayload as any);
    mockedPoolQuery.mockResolvedValue([activeUserRow, []] as any);

    const req = createMockRequest({ cookies: { admin_session: "cookie-token" } });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(mockedJwtVerify).toHaveBeenCalledWith("cookie-token", TEST_SECRET);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("cookie takes priority over Bearer header", async () => {
    mockedJwtVerify.mockReturnValue(validPayload as any);
    mockedPoolQuery.mockResolvedValue([activeUserRow, []] as any);

    const req = createMockRequest({
      headers: { authorization: "Bearer header-token" },
      cookies: { admin_session: "cookie-token" },
    });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(mockedJwtVerify).toHaveBeenCalledWith("cookie-token", TEST_SECRET);
  });

  // ── Token validation ───────────────────────────────────────────────────────

  it("returns 401 when token payload does not contain sub", async () => {
    mockedJwtVerify.mockReturnValue({
      username: "admin",
      email: "admin@example.com",
      role: "admin",
    } as any);

    const req = createMockRequest({ headers: { authorization: "Bearer valid-token" } });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token inválido",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token verification throws", async () => {
    mockedJwtVerify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const req = createMockRequest({ headers: { authorization: "Bearer invalid-token" } });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token inválido o expirado",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ── User validation ────────────────────────────────────────────────────────

  it("returns 401 when user is not found in DB", async () => {
    mockedJwtVerify.mockReturnValue(validPayload as any);
    mockedPoolQuery.mockResolvedValue([[], []] as any);

    const req = createMockRequest({ headers: { authorization: "Bearer valid-token" } });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Usuario no autorizado o inactivo",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when user is inactive", async () => {
    mockedJwtVerify.mockReturnValue(validPayload as any);
    mockedPoolQuery.mockResolvedValue([
      [{ ...activeUserRow[0], is_active: 0 }],
      [],
    ] as any);

    const req = createMockRequest({ headers: { authorization: "Bearer valid-token" } });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token_version does not match (revoked token)", async () => {
    // JWT payload has tv: 2, but DB has token_version: 3 (logout happened)
    mockedJwtVerify.mockReturnValue({ ...validPayload, tv: 2 } as any);
    mockedPoolQuery.mockResolvedValue([
      [{ ...activeUserRow[0], token_version: 3 }],
      [],
    ] as any);

    const req = createMockRequest({ headers: { authorization: "Bearer old-token" } });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Sesión revocada. Inicia sesión nuevamente.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it("sets req.authUser and calls next when token and user are valid", async () => {
    mockedJwtVerify.mockReturnValue(validPayload as any);
    mockedPoolQuery.mockResolvedValue([activeUserRow, []] as any);

    const req = createMockRequest({ headers: { authorization: "Bearer valid-token" } });
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(req.authUser).toEqual({
      id: "user-1",
      username: "admin",
      full_name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      is_active: true,
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
