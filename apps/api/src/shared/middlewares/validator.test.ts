import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { validateBody, validateParams, validateQuery } from "./validator.js";

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

function createMockRequest(data: Partial<Request>): Request {
  return data as unknown as Request;
}

describe("validator middleware", () => {
  it("validateBody calls next and replaces req.body with parsed data", () => {
    const schema = z.object({
      name: z.string().trim().min(1),
      age: z.coerce.number().int().positive(),
    });

    const req = createMockRequest({
      body: {
        name: "  Uziel  ",
        age: "24",
      },
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    validateBody(schema)(req, res, next);

    expect(req.body).toEqual({
      name: "Uziel",
      age: 24,
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("validateBody returns 400 when body is invalid", () => {
    const schema = z.object({
      username: z.string().min(3),
      password: z.string().min(8),
    });

    const req = createMockRequest({
      body: {
        username: "ab",
        password: "123",
      },
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Datos de entrada inválidos",
      errors: expect.arrayContaining([
        expect.objectContaining({
          field: "username",
        }),
        expect.objectContaining({
          field: "password",
        }),
      ]),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("validateParams calls next and replaces req.params with parsed data", () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const req = createMockRequest({
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    validateParams(schema)(req, res, next);

    expect(req.params).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validateParams returns 400 when params are invalid", () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const req = createMockRequest({
      params: {
        id: "invalid-id",
      },
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    validateParams(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Parámetros de ruta inválidos",
      errors: expect.arrayContaining([
        expect.objectContaining({
          field: "id",
        }),
      ]),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("validateQuery calls next and replaces req.query with parsed data", () => {
    const schema = z.object({
      page: z.coerce.number().int().positive(),
      limit: z.coerce.number().int().positive(),
    });

    const req = createMockRequest({
      query: {
        page: "1",
        limit: "10",
      },
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    validateQuery(schema)(req, res, next);

    expect(req.query).toEqual({
      page: 1,
      limit: 10,
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validateQuery returns 400 when query is invalid", () => {
    const schema = z.object({
      page: z.coerce.number().int().positive(),
    });

    const req = createMockRequest({
      query: {
        page: "0",
      },
    });

    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    validateQuery(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Parámetros de consulta inválidos",
      errors: expect.arrayContaining([
        expect.objectContaining({
          field: "page",
        }),
      ]),
    });
    expect(next).not.toHaveBeenCalled();
  });
});