import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "./safe-url";

describe("safeHttpUrl", () => {
  it("allows only absolute HTTP(S) URLs", () => {
    expect(safeHttpUrl("https://www.itoaxaca.edu.mx/tramite")).toBe(
      "https://www.itoaxaca.edu.mx/tramite"
    );
    expect(safeHttpUrl("http://localhost:3000/resource")).toBe(
      "http://localhost:3000/resource"
    );
    for (const unsafe of ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "/relative"]) {
      expect(safeHttpUrl(unsafe)).toBeNull();
    }
  });
});
