import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { authorizePermission } from "./authorize.middleware.js";
import {
  ROLE_PERMISSIONS,
  type RolePermissions,
  type UserRole,
} from "@ito-map/shared";

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

describe("authorizePermission complete role matrix", () => {
  const roles = Object.keys(ROLE_PERMISSIONS) as UserRole[];
  const permissions = Object.keys(ROLE_PERMISSIONS.superadmin) as Array<keyof RolePermissions>;

  for (const role of roles) {
    for (const permission of permissions) {
      it(`${role} ${ROLE_PERMISSIONS[role][permission] ? "allows" : "denies"} ${permission}`, () => {
        const req = { authUser: { id: "user-1", role } } as Request;
        const res = mockResponse();
        const next = vi.fn() as NextFunction;

        authorizePermission(permission)(req, res, next);

        if (ROLE_PERMISSIONS[role][permission]) {
          expect(next).toHaveBeenCalledOnce();
          expect(res.status).not.toHaveBeenCalled();
        } else {
          expect(next).not.toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(403);
        }
      });
    }
  }

  it("returns 401 before checking a permission when no user is authenticated", () => {
    const req = {} as Request;
    const res = mockResponse();
    const next = vi.fn() as NextFunction;

    authorizePermission("can_manage_students")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
