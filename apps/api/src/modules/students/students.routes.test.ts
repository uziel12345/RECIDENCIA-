import { describe, expect, it, vi } from "vitest";

vi.mock("../../config/env.js", () => ({
  env: {
    jwtSecret: "test-secret-that-is-at-least-32chars-long!!",
    jwtIssuer: "mapa-ito-api",
    jwtAudience: "mapa-ito-admin",
  },
}));

import router from "./students.routes.js";

type RouterLayer = {
  route?: {
    path: string;
    stack: Array<{ handle: { name?: string } }>;
  };
};

describe("student schedule route authorization", () => {
  for (const path of ["/:controlNumber/schedules", "/:controlNumber/mindbox-schedule"]) {
    it(`${path} authenticates before enforcing student-management permission`, () => {
      const layer = (router.stack as RouterLayer[]).find((candidate) => candidate.route?.path === path);
      const middlewareNames = layer?.route?.stack.map((item) => item.handle.name) ?? [];

      expect(middlewareNames).toContain("authenticate");
      expect(middlewareNames).toContain("authorizePermissionMiddleware");
      expect(middlewareNames.indexOf("authenticate")).toBeLessThan(
        middlewareNames.indexOf("authorizePermissionMiddleware")
      );
    });
  }
});
