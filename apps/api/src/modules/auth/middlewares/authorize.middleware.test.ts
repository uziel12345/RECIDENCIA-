import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { authorize } from "./authorize.middleware.js";
import type { AuthUser } from "../auth.service.js";

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

function createMockRequest(authUser?: AuthUser): Request {
  return {
    authUser,
  } as unknown as Request;
}

describe("authorize middleware", () => {
  it("returns 401 when there is no authenticated user", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    const middleware = authorize("admin");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Usuario no autenticado",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is not allowed", () => {
    const req = createMockRequest({
      id: "user-1",
      username: "viewer",
      full_name: "Viewer User",
      email: "viewer@example.com",
      role: "viewer",
      is_active: true,
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    const middleware = authorize("admin", "superadmin");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No tienes permisos para realizar esta acción",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when user role is allowed", () => {
    const req = createMockRequest({
      id: "user-1",
      username: "admin",
      full_name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      is_active: true,
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    const middleware = authorize("admin", "superadmin");

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("allows superadmin when superadmin is in allowed roles", () => {
    const req = createMockRequest({
      id: "user-1",
      username: "superadmin",
      full_name: "Super Admin User",
      email: "superadmin@example.com",
      role: "superadmin",
      is_active: true,
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    const middleware = authorize("admin", "superadmin");

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});