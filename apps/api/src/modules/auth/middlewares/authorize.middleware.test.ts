import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { authorizePermission } from "./authorize.middleware.js";

function mockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe("authorizePermission professor access", () => {
  it("allows recursos_humanos to view professor location", () => {
    const req = {
      authUser: { id: "u1", role: "recursos_humanos" },
    } as Request;
    const res = mockResponse();
    const next = vi.fn() as NextFunction;

    authorizePermission("can_view_professor_location")(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("denies viewer access to professor location", () => {
    const req = {
      authUser: { id: "u2", role: "viewer" },
    } as Request;
    const res = mockResponse();
    const next = vi.fn() as NextFunction;

    authorizePermission("can_view_professor_location")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
