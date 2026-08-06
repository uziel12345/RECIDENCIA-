import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { pool } from "../../db/connection.js";
import { invalidateAdminToken, loginAdmin } from "./auth.service.js";

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

vi.mock("argon2", () => ({
  default: { argon2id: 2, verify: vi.fn(), hash: vi.fn() },
}));

vi.mock("jsonwebtoken", () => ({
  default: { sign: vi.fn() },
}));

vi.mock("../../db/connection.js", () => ({
  pool: { query: vi.fn() },
}));

vi.mock("../../config/env.js", () => ({
  env: {
    jwtSecret: "test-secret-that-is-at-least-32chars-long!!",
    jwtExpiresIn: "8h",
    jwtIssuer: "mapa-ito-api",
    jwtAudience: "mapa-ito-admin",
  },
}));

// Must match the literal in the vi.mock factory above
const TEST_SECRET = "test-secret-that-is-at-least-32chars-long!!";

const mockedBcryptCompare = vi.mocked(bcrypt.compare);
const mockedArgonVerify = vi.mocked(argon2.verify);
const mockedArgonHash = vi.mocked(argon2.hash);
const mockedJwtSign = vi.mocked(jwt.sign);
const mockedPoolQuery = vi.mocked(pool.query);

const baseUserRow = {
  id: "user-1",
  username: "admin",
  full_name: "Admin User",
  email: "admin@example.com",
  password_hash: "$2b$12$legacy-hash-for-testing",
  role: "admin",
  is_active: 1,
  failed_login_attempts: 0,
  locked_until: null,
  token_version: 1,
};

describe("loginAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedArgonVerify.mockResolvedValue(false);
    mockedArgonHash.mockResolvedValue("$argon2id$upgraded");
  });

  it("throws when username/email is empty", async () => {
    await expect(
      loginAdmin({ usernameOrEmail: "   ", password: "secret12345" })
    ).rejects.toThrow("Credenciales inválidas");

    expect(mockedPoolQuery).not.toHaveBeenCalled();
  });

  it("throws when password is empty", async () => {
    await expect(
      loginAdmin({ usernameOrEmail: "admin", password: "" })
    ).rejects.toThrow("Credenciales inválidas");

    expect(mockedPoolQuery).not.toHaveBeenCalled();
  });

  it("throws Credenciales inválidas when user does not exist", async () => {
    mockedPoolQuery.mockResolvedValueOnce([[], []] as any);
    mockedBcryptCompare.mockResolvedValueOnce(false as never);

    await expect(
      loginAdmin({ usernameOrEmail: "missing", password: "secret12345" })
    ).rejects.toThrow("Credenciales inválidas");

    // bcrypt MUST run even for non-existent users to prevent timing attacks
    expect(mockedBcryptCompare).toHaveBeenCalledTimes(1);
    expect(mockedJwtSign).not.toHaveBeenCalled();
  });

  it("throws Credenciales inválidas when user is inactive", async () => {
    mockedPoolQuery.mockResolvedValueOnce([
      [{ ...baseUserRow, is_active: 0 }],
      [],
    ] as any);
    mockedBcryptCompare.mockResolvedValueOnce(false as never);

    await expect(
      loginAdmin({ usernameOrEmail: "admin", password: "secret12345" })
    ).rejects.toThrow("Credenciales inválidas");

    // bcrypt still runs to prevent timing leaks on inactive accounts
    expect(mockedBcryptCompare).toHaveBeenCalledTimes(1);
    expect(mockedJwtSign).not.toHaveBeenCalled();
  });

  it("returns the same generic error when account is locked", async () => {
    const lockedUntil = new Date(Date.now() + 20 * 60 * 1000);
    mockedPoolQuery.mockResolvedValueOnce([
      [{ ...baseUserRow, locked_until: lockedUntil }],
      [],
    ] as any);
    mockedBcryptCompare.mockResolvedValueOnce(false as never);

    await expect(
      loginAdmin({ usernameOrEmail: "admin", password: "wrong" })
    ).rejects.toThrow("Credenciales inválidas");

    expect(mockedJwtSign).not.toHaveBeenCalled();
  });

  it("increments failed_login_attempts and throws on wrong password", async () => {
    mockedPoolQuery
      .mockResolvedValueOnce([[baseUserRow], []] as any) // SELECT user
      .mockResolvedValueOnce([{ affectedRows: 1 }, []] as any); // UPDATE failed_attempts
    mockedBcryptCompare.mockResolvedValueOnce(false as never);

    await expect(
      loginAdmin({ usernameOrEmail: "admin", password: "wrong" })
    ).rejects.toThrow("Credenciales inválidas");

    expect(mockedBcryptCompare).toHaveBeenCalledWith("wrong", baseUserRow.password_hash);
    // SELECT + UPDATE for onLoginFailure
    expect(mockedPoolQuery).toHaveBeenCalledTimes(2);
    expect(mockedJwtSign).not.toHaveBeenCalled();
  });

  it("returns token and user with correct JWT payload on successful login", async () => {
    mockedPoolQuery
      .mockResolvedValueOnce([[baseUserRow], []] as any) // SELECT user
      .mockResolvedValueOnce([{ affectedRows: 1 }, []] as any); // UPDATE last_login / reset attempts
    mockedBcryptCompare.mockResolvedValueOnce(true as never);
    mockedJwtSign.mockReturnValueOnce("mock-token" as never);

    const result = await loginAdmin({ usernameOrEmail: " admin ", password: "secret12345" });

    expect(mockedBcryptCompare).toHaveBeenCalledWith("secret12345", baseUserRow.password_hash);

    expect(mockedJwtSign).toHaveBeenCalledWith(
      {
        sub: "user-1",
        tv: 1,
      },
      TEST_SECRET,
      {
        algorithm: "HS256",
        issuer: "mapa-ito-api",
        audience: "mapa-ito-admin",
        expiresIn: "8h",
      }
    );

    expect(mockedArgonHash).toHaveBeenCalledWith(
      "secret12345",
      expect.objectContaining({ memoryCost: 19_456, timeCost: 2, parallelism: 1 })
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

describe("invalidateAdminToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("increments token_version for the given user", async () => {
    mockedPoolQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []] as any);

    await invalidateAdminToken("user-1");

    expect(mockedPoolQuery).toHaveBeenCalledTimes(1);
    expect(mockedPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining("token_version = token_version + 1"),
      ["user-1"]
    );
  });
});
