import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { createCsrfToken, csrfProtection } from "./csrf.middleware.js";

const TEST_SECRET = "test-csrf-secret-that-is-long-enough-for-hmac-123";

function createMockReq(opts: {
  cookie?: string;
  header?: string;
} = {}): Request {
  return {
    cookies: opts.cookie !== undefined ? { csrf_token: opts.cookie } : {},
    headers: opts.header !== undefined ? { "x-csrf-token": opts.header } : {},
  } as unknown as Request;
}

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

describe("csrfProtection middleware", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls next when cookie and header carry a valid signed token", () => {
    const validToken = createCsrfToken(TEST_SECRET);
    const req = createMockReq({ cookie: validToken, header: validToken });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("returns 403 when X-CSRF-Token header is missing", () => {
    const validToken = createCsrfToken(TEST_SECRET);
    const req = createMockReq({ cookie: validToken }); // no header
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token CSRF inválido o faltante",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when csrf_token cookie is missing", () => {
    const validToken = createCsrfToken(TEST_SECRET);
    const req = createMockReq({ header: validToken }); // no cookie
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token CSRF inválido o faltante",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when cookie and header tokens do not match", () => {
    const tokenA = createCsrfToken(TEST_SECRET);
    const tokenB = createCsrfToken(TEST_SECRET); // different nonce → different token
    const req = createMockReq({ cookie: tokenA, header: tokenB });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when both cookie and header are missing", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when tokens are empty strings", () => {
    const req = createMockReq({ cookie: "", header: "" });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when token has correct format but wrong HMAC signature", () => {
    const validToken = createCsrfToken(TEST_SECRET);
    const [nonce] = validToken.split(".");
    const tamperedToken = `${nonce}.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
    const req = createMockReq({ cookie: tamperedToken, header: tamperedToken });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
