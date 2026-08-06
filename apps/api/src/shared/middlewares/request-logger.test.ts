import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { createRequestLogEntry } from "./request-logger.js";

describe("createRequestLogEntry", () => {
  it("logs a normalized route and never serializes query, cookies or body", () => {
    const req = {
      method: "POST\nspoof",
      baseUrl: "/api/auth",
      route: { path: "/login" },
      originalUrl: "/api/auth/login?token=secret",
      cookies: { admin_session: "secret-cookie" },
      body: { password: "secret-password" },
    } as unknown as Request;

    const entry = createRequestLogEntry(req, 401, 12.345, "request-1");
    const serialized = JSON.stringify(entry);

    expect(entry.route).toBe("/api/auth/login");
    expect(entry.method).toBe("POST spoof");
    expect(serialized).not.toContain("secret");
    expect(entry.level).toBe("warn");
  });
});
