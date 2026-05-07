import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { loginController, meController } from "./auth.controller.js";
import { loginAdmin } from "../modules/auth/auth.service.js";
import type { AuthUser } from "../modules/auth/auth.service.js";
import type { LoginInput } from "../modules/auth/auth.schema.js";

vi.mock("../modules/auth/auth.service.js", () => ({
  loginAdmin: vi.fn(),
}));

const mockedLoginAdmin = vi.mocked(loginAdmin);

type MockRequestData = {
  body?: unknown;
  authUser?: AuthUser;
};

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

function createMockRequest(data: MockRequestData): Request {
  return data as unknown as Request;
}

describe("auth controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loginController returns 200 when login is successful", async () => {
    mockedLoginAdmin.mockResolvedValue({
      token: "mock-token",
      user: {
        id: "user-1",
        username: "admin",
        full_name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        is_active: true,
      },
    });

    const req = createMockRequest({
      body: {
        usernameOrEmail: "admin",
        password: "secret123",
      },
    });

    const res = createMockResponse();

    await loginController(req as Request<{}, {}, LoginInput>, res);

    expect(mockedLoginAdmin).toHaveBeenCalledWith({
      usernameOrEmail: "admin",
      password: "secret123",
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        token: "mock-token",
        user: {
          id: "user-1",
          username: "admin",
          full_name: "Admin User",
          email: "admin@example.com",
          role: "admin",
          is_active: true,
        },
      },
    });
  });

  it("loginController returns 401 when login fails", async () => {
    mockedLoginAdmin.mockRejectedValue(new Error("Credenciales inválidas"));

    const req = createMockRequest({
      body: {
        usernameOrEmail: "admin",
        password: "wrong-password",
      },
    });

    const res = createMockResponse();

    await loginController(req as Request<{}, {}, LoginInput>, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Credenciales inválidas",
    });
  });

  it("loginController returns a default message when error is unknown", async () => {
    mockedLoginAdmin.mockRejectedValue("unknown-error");

    const req = createMockRequest({
      body: {
        usernameOrEmail: "admin",
        password: "wrong-password",
      },
    });

    const res = createMockResponse();

    await loginController(req as Request<{}, {}, LoginInput>, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "No se pudo iniciar sesión",
    });
  });

  it("meController returns authenticated user", async () => {
    const authUser: AuthUser = {
      id: "user-1",
      username: "admin",
      full_name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      is_active: true,
    };

    const req = createMockRequest({
      authUser,
    });

    const res = createMockResponse();

    await meController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        user: authUser,
      },
    });
  });
});