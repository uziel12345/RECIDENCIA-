import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("./config/env.js", () => ({
  env: {
    corsOrigin: "https://allowed.example",
    jwtSecret: "test-secret-that-is-at-least-32chars-long!!",
    jwtIssuer: "mapa-ito-api",
    jwtAudience: "mapa-ito-admin",
  },
}));

import app from "./app.js";

describe("HTTP security controls", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an unauthorized CORS origin", async () => {
    const response = await request(app)
      .get("/api/not-a-real-route")
      .set("Origin", "https://evil.example");

    expect(response.status).toBe(403);
    expect(response.body).toEqual(expect.objectContaining({ success: false }));
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows the configured origin and emits defensive headers", async () => {
    const response = await request(app)
      .get("/api/not-a-real-route")
      .set("Origin", "https://allowed.example");

    expect(response.status).toBe(404);
    expect(response.headers["access-control-allow-origin"]).toBe("https://allowed.example");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers["permissions-policy"]).toBe(
      "geolocation=(self), camera=(), microphone=()"
    );
    expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
