import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { loginController, logoutController, meController } from "./auth.controller.js";
import { loginAdmin, invalidateAdminToken } from "./auth.service.js";
import type { AuthUser } from "./auth.service.js";
import type { LoginInput } from "./auth.schema.js";

vi.mock("./auth.service.js", () => ({
  loginAdmin: vi.fn(),
  invalidateAdminToken: vi.fn(),
}));

vi.mock("../../shared/services/audit.service.js", () => ({
  auditLog: vi.fn(),
}));

const mockedLoginAdmin = vi.mocked(loginAdmin);
const mockedInvalidateAdminToken = vi.mocked(invalidateAdminToken);

type MockRequestData = {
  body?: unknown;
  authUser?: AuthUser;
};

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    cookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };
}

function createMockRequest(data: MockRequestData): Request {
  return data as unknown as Request;
}

const testUser: AuthUser = {
  id: "user-1",
  username: "admin",
  full_name: "Admin User",
  email: "admin@example.com",
  role: "admin",
  is_active: true,
};

describe("auth controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── loginController ────────────────────────────────────────────────────────

  it("loginController returns 200 and sets httpOnly cookie on success", async () => {
    mockedLoginAdmin.mockResolvedValue({ token: "mock-token", user: testUser });

    const req = createMockRequest({
      body: { usernameOrEmail: "admin", password: "secret12345" },
    });
    const res = createMockResponse();

    await loginController(req as Request<{}, {}, LoginInput>, res);

    expect(mockedLoginAdmin).toHaveBeenCalledWith({
      usernameOrEmail: "admin",
      password: "secret12345",
    });

    // Token goes in httpOnly cookie, NOT in response body
    expect(res.cookie).toHaveBeenCalledWith(
      "admin_session",
      "mock-token",
      expect.objectContaining({ httpOnly: true })
    );
    // CSRF cookie is readable by JS (httpOnly: false)
    expect(res.cookie).toHaveBeenCalledWith(
      "csrf_token",
      expect.any(String),
      expect.objectContaining({ httpOnly: false })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { user: testUser },
    });
  });

  it("loginController returns 401 when login fails", async () => {
    mockedLoginAdmin.mockRejectedValue(new Error("Credenciales inválidas"));

    const req = createMockRequest({
      body: { usernameOrEmail: "admin", password: "wrong" },
    });
    const res = createMockResponse();

    await loginController(req as Request<{}, {}, LoginInput>, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Credenciales inválidas",
    });
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it("loginController returns a generic message for unknown errors", async () => {
    mockedLoginAdmin.mockRejectedValue("unknown-error");

    const req = createMockRequest({
      body: { usernameOrEmail: "admin", password: "wrong" },
    });
    const res = createMockResponse();

    await loginController(req as Request<{}, {}, LoginInput>, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No se pudo iniciar sesión",
    });
  });

  // ── logoutController ───────────────────────────────────────────────────────

  it("logoutController invalidates token and clears cookies", async () => {
    mockedInvalidateAdminToken.mockResolvedValue(undefined);

    const req = createMockRequest({ authUser: testUser });
    const res = createMockResponse();

    await logoutController(req, res);

    expect(mockedInvalidateAdminToken).toHaveBeenCalledWith("user-1");
    expect(res.clearCookie).toHaveBeenCalledWith("admin_session", { path: "/" });
    expect(res.clearCookie).toHaveBeenCalledWith("csrf_token", { path: "/" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("logoutController clears cookies even when no auth user is present", async () => {
    const req = createMockRequest({});
    const res = createMockResponse();

    await logoutController(req, res);

    expect(mockedInvalidateAdminToken).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ── meController ───────────────────────────────────────────────────────────

  it("meController returns the authenticated user", async () => {
    const req = createMockRequest({ authUser: testUser });
    const res = createMockResponse();

    await meController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { user: testUser },
    });
  });
});
