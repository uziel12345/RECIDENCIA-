import { describe, expect, it } from "vitest";
import {
  buildingProcedureParamsSchema,
  createProcedureSchema,
  createRequirementSchema,
  linkProcedureSchema,
  procedureIdSchema,
  procedureStatusSchema,
  proceduresQuerySchema,
  requirementIdSchema,
  updateProcedureSchema,
  updateRequirementSchema,
} from "./procedures.schema.js";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("createProcedureSchema", () => {
  it("accepts valid minimal input", () => {
    const result = createProcedureSchema.safeParse({
      name: "Constancia de estudios",
      slug: "constancia-estudios",
      kind: "tramite",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid full input with requirements", () => {
    const result = createProcedureSchema.safeParse({
      name: "Constancia",
      slug: "constancia",
      description: "Descripción del trámite",
      kind: "servicio",
      is_active: false,
      requirements: [
        { description: "CURP", is_mandatory: true, display_order: 0 },
        { description: "INE" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createProcedureSchema.safeParse({
      slug: "constancia",
      kind: "tramite",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing kind", () => {
    const result = createProcedureSchema.safeParse({
      name: "Constancia",
      slug: "constancia",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid kind", () => {
    const result = createProcedureSchema.safeParse({
      name: "Constancia",
      slug: "constancia",
      kind: "otro",
    });
    expect(result.success).toBe(false);
  });

  it("accepts both valid kind values", () => {
    for (const kind of ["tramite", "servicio"] as const) {
      const result = createProcedureSchema.safeParse({
        name: "X",
        slug: "x",
        kind,
      });
      expect(result.success, `kind '${kind}' should be valid`).toBe(true);
    }
  });

  it("accepts department_id/internal_location/schedule_text", () => {
    const result = createProcedureSchema.safeParse({
      name: "Constancia",
      slug: "constancia",
      kind: "servicio",
      department_id: VALID_UUID,
      internal_location: "Planta baja, oficina 3",
      schedule_text: "Lunes a viernes 9:00-14:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid department_id (not UUID)", () => {
    const result = createProcedureSchema.safeParse({
      name: "Constancia",
      slug: "constancia",
      kind: "servicio",
      department_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null department_id/internal_location/schedule_text", () => {
    const result = createProcedureSchema.safeParse({
      name: "Constancia",
      slug: "constancia",
      kind: "servicio",
      department_id: null,
      internal_location: null,
      schedule_text: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects slug with uppercase letters", () => {
    const result = createProcedureSchema.safeParse({
      name: "X",
      slug: "Constancia-Estudios",
      kind: "tramite",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with leading hyphen", () => {
    const result = createProcedureSchema.safeParse({
      name: "X",
      slug: "-constancia",
      kind: "tramite",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with trailing hyphen", () => {
    const result = createProcedureSchema.safeParse({
      name: "X",
      slug: "constancia-",
      kind: "tramite",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const result = createProcedureSchema.safeParse({
      name: "X",
      slug: "constancia estudios",
      kind: "tramite",
    });
    expect(result.success).toBe(false);
  });

  it("rejects requirement with empty description", () => {
    const result = createProcedureSchema.safeParse({
      name: "X",
      slug: "x",
      kind: "tramite",
      requirements: [{ description: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts null description", () => {
    const result = createProcedureSchema.safeParse({
      name: "X",
      slug: "x",
      kind: "tramite",
      description: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateProcedureSchema", () => {
  it("accepts empty object (all optional)", () => {
    expect(updateProcedureSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with only name", () => {
    expect(updateProcedureSchema.safeParse({ name: "Nuevo" }).success).toBe(true);
  });

  it("validates slug format even on partial update", () => {
    const result = updateProcedureSchema.safeParse({ slug: "INVALID SLUG" });
    expect(result.success).toBe(false);
  });

  it("accepts empty requirements array (to clear all)", () => {
    const result = updateProcedureSchema.safeParse({ requirements: [] });
    expect(result.success).toBe(true);
  });
});

describe("procedureIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(procedureIdSchema.safeParse({ id: VALID_UUID }).success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    expect(procedureIdSchema.safeParse({ id: "not-valid" }).success).toBe(false);
  });

  it("rejects missing id", () => {
    expect(procedureIdSchema.safeParse({}).success).toBe(false);
  });
});

describe("requirementIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(requirementIdSchema.safeParse({ id: VALID_UUID }).success).toBe(true);
  });

  it("rejects non-UUID", () => {
    expect(requirementIdSchema.safeParse({ id: "bad" }).success).toBe(false);
  });
});

describe("procedureStatusSchema", () => {
  it("accepts true", () => {
    expect(procedureStatusSchema.safeParse({ is_active: true }).success).toBe(true);
  });

  it("accepts false", () => {
    expect(procedureStatusSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it("rejects missing is_active", () => {
    expect(procedureStatusSchema.safeParse({}).success).toBe(false);
  });

  it("rejects string 'true'", () => {
    expect(procedureStatusSchema.safeParse({ is_active: "true" }).success).toBe(false);
  });
});

describe("createRequirementSchema", () => {
  it("accepts valid input", () => {
    expect(
      createRequirementSchema.safeParse({ description: "CURP" }).success
    ).toBe(true);
  });

  it("accepts full input", () => {
    expect(
      createRequirementSchema.safeParse({
        description: "CURP",
        is_mandatory: false,
        display_order: 1,
      }).success
    ).toBe(true);
  });

  it("rejects empty description", () => {
    expect(createRequirementSchema.safeParse({ description: "" }).success).toBe(false);
  });

  it("rejects missing description", () => {
    expect(createRequirementSchema.safeParse({}).success).toBe(false);
  });

  it("rejects negative display_order", () => {
    expect(
      createRequirementSchema.safeParse({ description: "X", display_order: -1 }).success
    ).toBe(false);
  });
});

describe("updateRequirementSchema", () => {
  it("accepts empty object", () => {
    expect(updateRequirementSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update", () => {
    expect(
      updateRequirementSchema.safeParse({ is_mandatory: false }).success
    ).toBe(true);
  });
});

describe("linkProcedureSchema", () => {
  it("accepts valid input without notes", () => {
    const result = linkProcedureSchema.safeParse({ procedure_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with notes", () => {
    const result = linkProcedureSchema.safeParse({
      procedure_id: VALID_UUID,
      notes: "Ventanilla 3",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null notes", () => {
    const result = linkProcedureSchema.safeParse({
      procedure_id: VALID_UUID,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid procedure_id", () => {
    const result = linkProcedureSchema.safeParse({ procedure_id: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing procedure_id", () => {
    const result = linkProcedureSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("buildingProcedureParamsSchema", () => {
  it("accepts valid building id and procedure id", () => {
    const result = buildingProcedureParamsSchema.safeParse({
      id: VALID_UUID,
      procedureId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid building id", () => {
    const result = buildingProcedureParamsSchema.safeParse({
      id: "bad",
      procedureId: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid procedure id", () => {
    const result = buildingProcedureParamsSchema.safeParse({
      id: VALID_UUID,
      procedureId: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(buildingProcedureParamsSchema.safeParse({}).success).toBe(false);
  });
});

describe("proceduresQuerySchema", () => {
  it("accepts empty query", () => {
    expect(proceduresQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid kind", () => {
    expect(proceduresQuerySchema.safeParse({ kind: "tramite" }).success).toBe(true);
    expect(proceduresQuerySchema.safeParse({ kind: "servicio" }).success).toBe(true);
  });

  it("rejects invalid kind", () => {
    expect(proceduresQuerySchema.safeParse({ kind: "otro" }).success).toBe(false);
  });

  it("accepts valid buildingId UUID", () => {
    expect(
      proceduresQuerySchema.safeParse({ buildingId: VALID_UUID }).success
    ).toBe(true);
  });

  it("rejects invalid buildingId (not UUID)", () => {
    expect(
      proceduresQuerySchema.safeParse({ buildingId: "bad" }).success
    ).toBe(false);
  });
});
