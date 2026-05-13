import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "./authenticate.middleware.js";
import { pool } from "../../../db/connection.js";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../../../db/connection.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

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

function createMockRequest(headers: Request["headers"] = {}): Request {
  return {
    headers,
  } as unknown as Request;
}

describe("authenticate middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it("returns 401 when authorization header is missing", async () => {
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

  it("returns 401 when authorization header is not Bearer", async () => {
    const req = createMockRequest({
      authorization: "Basic token",
    });

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

  it("returns 401 when token payload does not contain sub", async () => {
    mockedJwtVerify.mockReturnValue({
      username: "admin",
      email: "admin@example.com",
      role: "admin",
    } as any);

    const req = createMockRequest({
      authorization: "Bearer valid-token",
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(mockedJwtVerify).toHaveBeenCalledWith("valid-token", "test-secret");
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

    const req = createMockRequest({
      authorization: "Bearer invalid-token",
    });

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

  it("returns 401 when user is not found", async () => {
    mockedJwtVerify.mockReturnValue({
      sub: "user-1",
      username: "admin",
      email: "admin@example.com",
      role: "admin",
    } as any);

    mockedPoolQuery.mockResolvedValue([[], []] as any);

    const req = createMockRequest({
      authorization: "Bearer valid-token",
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(mockedPoolQuery).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Usuario no autorizado o inactivo",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when user is inactive", async () => {
    mockedJwtVerify.mockReturnValue({
      sub: "user-1",
      username: "admin",
      email: "admin@example.com",
      role: "admin",
    } as any);

    mockedPoolQuery.mockResolvedValue([
      [
        {
          id: "user-1",
          username: "admin",
          full_name: "Admin User",
          email: "admin@example.com",
          role: "admin",
          is_active: 0,
        },
      ],
      [],
    ] as any);

    const req = createMockRequest({
      authorization: "Bearer valid-token",
    });

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

  it("sets req.authUser and calls next when token and user are valid", async () => {
    mockedJwtVerify.mockReturnValue({
      sub: "user-1",
      username: "admin",
      email: "admin@example.com",
      role: "admin",
    } as any);

    mockedPoolQuery.mockResolvedValue([
      [
        {
          id: "user-1",
          username: "admin",
          full_name: "Admin User",
          email: "admin@example.com",
          role: "admin",
          is_active: 1,
        },
      ],
      [],
    ] as any);

    const req = createMockRequest({
      authorization: "Bearer valid-token",
    });

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
    expect(res.json).not.toHaveBeenCalled();
  });
});