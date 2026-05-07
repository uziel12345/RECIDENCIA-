import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db/connection.js";
import { loginAdmin } from "./auth.service.js";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
  },
}));

vi.mock("../../db/connection.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

const mockedBcryptCompare = vi.mocked(bcrypt.compare);
const mockedJwtSign = vi.mocked(jwt.sign);
const mockedPoolQuery = vi.mocked(pool.query);

const activeAdminRow = {
  id: "user-1",
  username: "admin",
  full_name: "Admin User",
  email: "admin@example.com",
  password_hash: "hashed-password",
  role: "admin",
  is_active: 1,
};

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "8h";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  it("throws when username/email is empty", async () => {
    await expect(
      loginAdmin({
        usernameOrEmail: "   ",
        password: "secret123",
      })
    ).rejects.toThrow("Usuario/correo y contraseña son obligatorios");

    expect(mockedPoolQuery).not.toHaveBeenCalled();
  });

  it("throws when password is empty", async () => {
    await expect(
      loginAdmin({
        usernameOrEmail: "admin",
        password: "",
      })
    ).rejects.toThrow("Usuario/correo y contraseña son obligatorios");

    expect(mockedPoolQuery).not.toHaveBeenCalled();
  });

  it("throws when admin user does not exist", async () => {
    mockedPoolQuery.mockResolvedValueOnce([[], []] as any);

    await expect(
      loginAdmin({
        usernameOrEmail: "missing",
        password: "secret123",
      })
    ).rejects.toThrow("Credenciales inválidas");

    expect(mockedPoolQuery).toHaveBeenCalledTimes(1);
    expect(mockedBcryptCompare).not.toHaveBeenCalled();
    expect(mockedJwtSign).not.toHaveBeenCalled();
  });

  it("throws when admin user is inactive", async () => {
    mockedPoolQuery.mockResolvedValueOnce([
      [
        {
          ...activeAdminRow,
          is_active: 0,
        },
      ],
      [],
    ] as any);

    await expect(
      loginAdmin({
        usernameOrEmail: "admin",
        password: "secret123",
      })
    ).rejects.toThrow("El usuario administrador está inactivo");

    expect(mockedBcryptCompare).not.toHaveBeenCalled();
    expect(mockedJwtSign).not.toHaveBeenCalled();
  });

  it("throws when password does not match", async () => {
    mockedPoolQuery.mockResolvedValueOnce([[activeAdminRow], []] as any);
    mockedBcryptCompare.mockResolvedValueOnce(false as never);

    await expect(
      loginAdmin({
        usernameOrEmail: "admin",
        password: "wrong-password",
      })
    ).rejects.toThrow("Credenciales inválidas");

    expect(mockedBcryptCompare).toHaveBeenCalledWith(
      "wrong-password",
      "hashed-password"
    );
    expect(mockedJwtSign).not.toHaveBeenCalled();
  });

  it("throws when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;

    mockedPoolQuery.mockResolvedValueOnce([[activeAdminRow], []] as any);
    mockedBcryptCompare.mockResolvedValueOnce(true as never);

    await expect(
      loginAdmin({
        usernameOrEmail: "admin",
        password: "secret123",
      })
    ).rejects.toThrow("JWT_SECRET no está configurado en el archivo .env");

    expect(mockedJwtSign).not.toHaveBeenCalled();
  });

  it("returns token and user when login is successful", async () => {
    mockedPoolQuery
      .mockResolvedValueOnce([[activeAdminRow], []] as any)
      .mockResolvedValueOnce([[], []] as any);

    mockedBcryptCompare.mockResolvedValueOnce(true as never);
    mockedJwtSign.mockReturnValueOnce("mock-token" as never);

    const result = await loginAdmin({
      usernameOrEmail: " admin ",
      password: "secret123",
    });

    expect(mockedPoolQuery).toHaveBeenCalledTimes(2);

    expect(mockedBcryptCompare).toHaveBeenCalledWith(
      "secret123",
      "hashed-password"
    );

    expect(mockedJwtSign).toHaveBeenCalledWith(
      {
        sub: "user-1",
        username: "admin",
        email: "admin@example.com",
        role: "admin",
      },
      "test-secret",
      {
        expiresIn: "8h",
      }
    );

    expect(result).toEqual({
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
  });
});