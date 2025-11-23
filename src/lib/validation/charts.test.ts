import { describe, it, expect } from "vitest";
import { chartQuerySchema } from "./charts";

// ============================================================================
// chartQuerySchema Tests
// ============================================================================

describe("chartQuerySchema", () => {
  describe("Scenariusze pozytywne", () => {
    it("CHARTS-Q-001: Tylko typ wykresu", () => {
      const input = { type: "consumption" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("consumption");
        expect(result.data.limit).toBe(50);
      }
    });

    it("CHARTS-Q-002: Typ price_per_liter", () => {
      const input = { type: "price_per_liter" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("price_per_liter");
      }
    });

    it("CHARTS-Q-003: Typ distance", () => {
      const input = { type: "distance" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("distance");
      }
    });

    it("CHARTS-Q-004: Z zakresem dat", () => {
      const input = {
        type: "consumption",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
      };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CHARTS-Q-005: Z custom limit", () => {
      const input = { type: "consumption", limit: "100" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
        expect(typeof result.data.limit).toBe("number");
      }
    });

    it("CHARTS-Q-006: Maksymalny limit", () => {
      const input = { type: "consumption", limit: "1000" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1000);
      }
    });

    it("CHARTS-Q-007: Minimalny limit", () => {
      const input = { type: "consumption", limit: "1" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it("CHARTS-Q-008: Tylko start_date", () => {
      const input = { type: "consumption", start_date: "2024-01-01T00:00:00Z" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CHARTS-Q-009: Tylko end_date", () => {
      const input = { type: "consumption", end_date: "2024-12-31T23:59:59Z" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CHARTS-Q-010: start_date = end_date", () => {
      const input = {
        type: "consumption",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-01-01T00:00:00Z",
      };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe("Scenariusze negatywne", () => {
    it("CHARTS-Q-N001: Brak typu", () => {
      const input = {};
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Required");
      }
    });

    it("CHARTS-Q-N002: Nieprawidłowy typ", () => {
      const input = { type: "invalid" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid enum value");
      }
    });

    it("CHARTS-Q-N003: Nieprawidłowa start_date", () => {
      const input = { type: "consumption", start_date: "2024-01-01" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("ISO 8601");
      }
    });

    it("CHARTS-Q-N004: Nieprawidłowa end_date", () => {
      const input = { type: "consumption", end_date: "2024/12/31" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("ISO 8601");
      }
    });

    it("CHARTS-Q-N005: start_date > end_date", () => {
      const input = {
        type: "consumption",
        start_date: "2024-12-31T00:00:00Z",
        end_date: "2024-01-01T00:00:00Z",
      };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("before or equal to end date");
      }
    });

    it("CHARTS-Q-N006: limit = 0", () => {
      const input = { type: "consumption", limit: "0" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("greater than or equal to 1");
      }
    });

    it("CHARTS-Q-N007: limit > 1000", () => {
      const input = { type: "consumption", limit: "1001" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("less than or equal to 1000");
      }
    });

    it("CHARTS-Q-N008: limit ujemny", () => {
      const input = { type: "consumption", limit: "-10" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("greater than or equal to 1");
      }
    });

    it("CHARTS-Q-N009: limit jako float (string)", () => {
      const input = { type: "consumption", limit: "50.5" };
      const result = chartQuerySchema.safeParse(input);

      // parseInt converts "50.5" to 50, which is valid
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("CHARTS-Q-N010: limit jako nieprawidłowy string", () => {
      const input = { type: "consumption", limit: "abc" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("number");
      }
    });

    it("CHARTS-Q-N011: Dodatkowe pola (strict mode)", () => {
      const input = { type: "consumption", extra: "field" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Unrecognized key");
      }
    });
  });

  describe("Warunki brzegowe", () => {
    it("CHARTS-Q-E001: Data z timezone offset", () => {
      const input = { type: "consumption", start_date: "2024-01-01T00:00:00+01:00" };
      const result = chartQuerySchema.safeParse(input);

      // Zod datetime() with offset requires UTC format
      expect(result.success).toBe(false);
    });

    it("CHARTS-Q-E002: Data z milisekundami", () => {
      const input = { type: "consumption", start_date: "2024-01-01T00:00:00.123Z" };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CHARTS-Q-E003: start_date jako null", () => {
      const input = { type: "consumption", start_date: null };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });

    it("CHARTS-Q-E004: Bardzo odległe daty", () => {
      const input = {
        type: "consumption",
        start_date: "1900-01-01T00:00:00Z",
        end_date: "2100-12-31T23:59:59Z",
      };
      const result = chartQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });
});
