import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { csrfProtection } from "./csrf.middleware.js";

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
  it("calls next when cookie and header tokens match", () => {
    const req = createMockReq({ cookie: "abc123", header: "abc123" });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("returns 403 when X-CSRF-Token header is missing", () => {
    const req = createMockReq({ cookie: "abc123" }); // no header
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
    const req = createMockReq({ header: "abc123" }); // no cookie
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
    const req = createMockReq({ cookie: "token-A", header: "token-B" });
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
});
