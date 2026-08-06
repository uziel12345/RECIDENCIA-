import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "./error-handler.js";

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

describe("errorHandler", () => {
  it("returns 400 for malformed JSON bodies", () => {
    const error = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
      status: 400,
    });
    const res = createMockResponse();

    errorHandler(
      error,
      {} as Request,
      res,
      vi.fn() as unknown as NextFunction
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "El cuerpo JSON no es valido",
      code: "INVALID_JSON",
    });
  });

  it("returns 413 for request bodies over the configured limit", () => {
    const error = Object.assign(new Error("request entity too large"), {
      type: "entity.too.large",
      status: 413,
    });
    const res = createMockResponse();

    errorHandler(
      error,
      {} as Request,
      res,
      vi.fn() as unknown as NextFunction
    );

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "El cuerpo de la solicitud excede el tamano maximo permitido",
      code: "PAYLOAD_TOO_LARGE",
    });
  });
});
