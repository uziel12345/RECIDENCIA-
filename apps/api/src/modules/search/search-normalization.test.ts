import { describe, expect, it } from "vitest";
import {
  calculateSearchScore,
  interpretSearchIntent,
  normalizeClassroomCode,
  normalizeSearchText,
  tokenizeSearchQuery,
} from "./search-normalization.js";

describe("search normalization", () => {
  it.each([
    ["dirección", "direccion"],
    ["  SERVICIOS   ESCOLARES ", "servicios escolares"],
    ["¿Dónde está el director?", "donde esta el director"],
    ["I4", "i-4"],
    ["I-4", "i-4"],
    ["i 4", "i-4"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeSearchText(input)).toBe(expected);
  });

  it.each(["I4", "I-4", "i 4", "Aula I4", "Aula I-4"])(
    "normalizes classroom code %s",
    (input) => expect(normalizeClassroomCode(input)).toBe("i-4")
  );

  it("extracts the useful terms from a natural-language question", () => {
    expect(tokenizeSearchQuery("¿Dónde encuentro al director del tecnológico?")).toEqual([
      "director",
    ]);
    expect(
      tokenizeSearchQuery("Necesito una constancia de terminación de inglés")
    ).toEqual(["constancia", "terminacion", "ingles"]);
  });

  it("recognizes position and service intent", () => {
    expect(interpretSearchIntent("donde encuentro al director").preferredKinds).toContain(
      "position"
    );
    expect(interpretSearchIntent("quiero inscribirme")).toMatchObject({
      normalizedQuery: "inscripcion",
    });
  });

  it("keeps a bare type word instead of discarding the whole query", () => {
    expect(tokenizeSearchQuery("aula")).toEqual(["aula"]);
    expect(tokenizeSearchQuery("edificio")).toEqual(["edificio"]);
  });

  it("still drops the type word when it accompanies more specific content", () => {
    expect(tokenizeSearchQuery("aula i4")).toEqual(["i-4"]);
  });
});

describe("search scoring", () => {
  const base = {
    kind: "service" as const,
    subtitle: "Servicio",
    description: null,
    aliases: ["constancia de estudios"],
    keywords: ["documentos escolares"],
  };

  it("ranks an exact title above an alias and a description", () => {
    const intent = interpretSearchIntent("inscripcion");
    const exact = calculateSearchScore(intent, { ...base, title: "Inscripción" });
    const alias = calculateSearchScore(intent, {
      ...base,
      title: "Registro escolar",
      aliases: ["inscripcion"],
    });
    const description = calculateSearchScore(intent, {
      ...base,
      title: "Atención estudiantil",
      aliases: [],
      description: "Información sobre inscripción",
    });
    expect(exact).toBeGreaterThan(alias);
    expect(alias).toBeGreaterThan(description);
  });

  it("tolerates a small spelling mistake", () => {
    const score = calculateSearchScore(interpretSearchIntent("bibliotca"), {
      ...base,
      kind: "building",
      title: "Biblioteca",
      aliases: [],
    });
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it.each(["I4", "I-4", "i 4", "aula i 4", "aula i4"])(
    "matches a classroom stored without a separator (title \"I4\") against the query %s",
    (query) => {
      const score = calculateSearchScore(interpretSearchIntent(query), {
        kind: "classroom",
        title: "I4",
        subtitle: "I4 · EDIF. I",
        description: null,
        aliases: [],
        keywords: ["I4", "aula", "I"],
      });
      expect(score).toBe(100);
    }
  );
});
