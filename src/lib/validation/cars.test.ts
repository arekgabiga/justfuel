import { describe, it, expect } from "vitest";
import {
  listCarsQuerySchema,
  carIdParamSchema,
  createCarCommandSchema,
  updateCarCommandSchema,
  deleteCarCommandSchema,
} from "./cars";

// ============================================================================
// listCarsQuerySchema Tests
// ============================================================================

describe("listCarsQuerySchema", () => {
  describe("Scenariusze pozytywne", () => {
    it("CARS-LQ-001: Domyślne wartości", () => {
      const input = {};
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ sort: "name", order: "asc" });
      }
    });

    it("CARS-LQ-002: Sortowanie po nazwie rosnąco", () => {
      const input = { sort: "name", order: "asc" };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ sort: "name", order: "asc" });
      }
    });

    it("CARS-LQ-003: Sortowanie po dacie utworzenia malejąco", () => {
      const input = { sort: "created_at", order: "desc" };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ sort: "created_at", order: "desc" });
      }
    });

    it("CARS-LQ-004: Tylko sort (order domyślne)", () => {
      const input = { sort: "created_at" };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ sort: "created_at", order: "asc" });
      }
    });

    it("CARS-LQ-005: Tylko order (sort domyślne)", () => {
      const input = { order: "desc" };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ sort: "name", order: "desc" });
      }
    });
  });

  describe("Scenariusze negatywne", () => {
    it("CARS-LQ-N001: Nieprawidłowa wartość sort", () => {
      const input = { sort: "invalid" };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid enum value");
      }
    });

    it("CARS-LQ-N002: Nieprawidłowa wartość order", () => {
      const input = { order: "invalid" };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid enum value");
      }
    });

    it("CARS-LQ-N003: Dodatkowe pola (strict mode)", () => {
      const input = { sort: "name", extra: "field" };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Unrecognized key");
      }
    });

    it("CARS-LQ-N004: Nieprawidłowy typ sort", () => {
      const input = { sort: 123 };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });

    it("CARS-LQ-N005: Nieprawidłowy typ order", () => {
      const input = { order: true };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });
  });

  describe("Warunki brzegowe", () => {
    it("CARS-LQ-E001: Null jako wartość", () => {
      const input = { sort: null };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("CARS-LQ-E002: Undefined jako wartość", () => {
      const input = { sort: undefined };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("name");
      }
    });

    it("CARS-LQ-E003: Pusty string", () => {
      const input = { sort: "" };
      const result = listCarsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid enum value");
      }
    });
  });
});

// ============================================================================
// carIdParamSchema Tests
// ============================================================================

describe("carIdParamSchema", () => {
  describe("Scenariusze pozytywne", () => {
    it("CARS-CP-001: Prawidłowy UUID v4", () => {
      const input = { carId: "123e4567-e89b-12d3-a456-426614174000" };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CARS-CP-002: UUID z małymi literami", () => {
      const input = { carId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CARS-CP-003: UUID z dużymi literami", () => {
      const input = { carId: "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11" };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe("Scenariusze negatywne", () => {
    it("CARS-CP-N001: Nieprawidłowy UUID (zbyt krótki)", () => {
      const input = { carId: "123" };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid uuid");
      }
    });

    it("CARS-CP-N002: Nieprawidłowy UUID (format)", () => {
      const input = { carId: "not-a-uuid" };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid uuid");
      }
    });

    it("CARS-CP-N003: Pusty string", () => {
      const input = { carId: "" };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid uuid");
      }
    });

    it("CARS-CP-N004: Brak pola carId", () => {
      const input = {};
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Required");
      }
    });

    it("CARS-CP-N005: Dodatkowe pola (strict mode)", () => {
      const input = { carId: "123e4567-e89b-12d3-a456-426614174000", extra: "field" };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Unrecognized key");
      }
    });

    it("CARS-CP-N006: UUID z białymi znakami", () => {
      const input = { carId: " 123e4567-e89b-12d3-a456-426614174000 " };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid uuid");
      }
    });

    it("CARS-CP-N007: Null", () => {
      const input = { carId: null };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });

    it("CARS-CP-N008: Number", () => {
      const input = { carId: 12345 };
      const result = carIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });
  });
});

// ============================================================================
// createCarCommandSchema Tests
// ============================================================================

describe("createCarCommandSchema", () => {
  describe("Scenariusze pozytywne", () => {
    it("CARS-CC-001: Minimalne wymagane pola", () => {
      const input = { name: "Audi A4", mileage_input_preference: "odometer" as const };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Audi A4");
        expect(result.data.mileage_input_preference).toBe("odometer");
      }
    });

    it("CARS-CC-002: Z początkowym licznikiem", () => {
      const input = {
        name: "BMW X5",
        initial_odometer: 50000,
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.initial_odometer).toBe(50000);
      }
    });

    it("CARS-CC-003: Preferencja distance", () => {
      const input = { name: "Toyota", mileage_input_preference: "distance" as const };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mileage_input_preference).toBe("distance");
      }
    });

    it("CARS-CC-004: Początkowy licznik = 0", () => {
      const input = {
        name: "Ford",
        initial_odometer: 0,
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.initial_odometer).toBe(0);
      }
    });

    it("CARS-CC-005: Nazwa z białymi znakami (trim)", () => {
      const input = { name: "  Tesla  ", mileage_input_preference: "odometer" as const };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Tesla");
      }
    });

    it("CARS-CC-006: Nazwa maksymalnej długości (100 znaków)", () => {
      const input = {
        name: "A".repeat(100),
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CARS-CC-007: Nazwa ze znakami specjalnymi", () => {
      const input = {
        name: "Audi A4 (2020) - Sedan",
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe("Scenariusze negatywne", () => {
    it("CARS-CC-N001: Brak nazwy", () => {
      const input = { mileage_input_preference: "odometer" as const };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Required");
      }
    });

    it("CARS-CC-N002: Pusty string (po trim)", () => {
      const input = { name: "   ", mileage_input_preference: "odometer" as const };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 1 character");
      }
    });

    it("CARS-CC-N003: Nazwa za długa (>100 znaków)", () => {
      const input = {
        name: "A".repeat(101),
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at most 100 character");
      }
    });

    it("CARS-CC-N004: Brak mileage_input_preference", () => {
      const input = { name: "Audi" };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Required");
      }
    });

    it("CARS-CC-N005: Nieprawidłowa preferencja", () => {
      const input = { name: "Audi", mileage_input_preference: "invalid" };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid enum value");
      }
    });

    it("CARS-CC-N006: Ujemny initial_odometer", () => {
      const input = {
        name: "Audi",
        initial_odometer: -100,
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("greater than or equal to 0");
      }
    });

    it("CARS-CC-N007: initial_odometer jako float", () => {
      const input = {
        name: "Audi",
        initial_odometer: 50.5,
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("integer");
      }
    });

    it("CARS-CC-N008: Dodatkowe pola (strict mode)", () => {
      const input = {
        name: "Audi",
        extra: "field",
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Unrecognized key");
      }
    });

    it("CARS-CC-N009: Nazwa jako number", () => {
      const input = { name: 123, mileage_input_preference: "odometer" as const };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });

    it("CARS-CC-N010: initial_odometer jako string", () => {
      const input = {
        name: "Audi",
        initial_odometer: "50000",
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });
  });

  describe("Warunki brzegowe", () => {
    it("CARS-CC-E001: initial_odometer = MAX_SAFE_INTEGER", () => {
      const input = {
        name: "Test",
        initial_odometer: Number.MAX_SAFE_INTEGER,
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CARS-CC-E002: initial_odometer = Infinity", () => {
      const input = {
        name: "Test",
        initial_odometer: Infinity,
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("CARS-CC-E003: initial_odometer = NaN", () => {
      const input = {
        name: "Test",
        initial_odometer: NaN,
        mileage_input_preference: "odometer" as const,
      };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("CARS-CC-E004: Nazwa tylko z emoji", () => {
      const input = { name: "🚗", mileage_input_preference: "odometer" as const };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CARS-CC-E005: Nazwa z wieloma spacjami", () => {
      const input = { name: "Audi    A4", mileage_input_preference: "odometer" as const };
      const result = createCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Audi    A4");
      }
    });
  });
});

// ============================================================================
// updateCarCommandSchema Tests
// ============================================================================

describe("updateCarCommandSchema", () => {
  describe("Scenariusze pozytywne", () => {
    it("CARS-UC-001: Aktualizacja tylko nazwy", () => {
      const input = { name: "New Name" };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Name");
      }
    });

    it("CARS-UC-002: Aktualizacja tylko preferencji", () => {
      const input = { mileage_input_preference: "distance" as const };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mileage_input_preference).toBe("distance");
      }
    });

    it("CARS-UC-003: Aktualizacja obu pól", () => {
      const input = { name: "New Name", mileage_input_preference: "distance" as const };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it("CARS-UC-004: Nazwa z trim", () => {
      const input = { name: "  New Name  " };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Name");
      }
    });
  });

  describe("Scenariusze negatywne", () => {
    it("CARS-UC-N001: Pusty obiekt", () => {
      const input = {};
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one field must be provided");
      }
    });

    it("CARS-UC-N002: Pusty string (po trim)", () => {
      const input = { name: "   " };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 1 character");
      }
    });

    it("CARS-UC-N003: Nazwa za długa", () => {
      const input = { name: "A".repeat(101) };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at most 100 character");
      }
    });

    it("CARS-UC-N004: Nieprawidłowa preferencja", () => {
      const input = { mileage_input_preference: "invalid" };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid enum value");
      }
    });

    it("CARS-UC-N005: Dodatkowe pola (strict mode)", () => {
      const input = { name: "Test", extra: "field" };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Unrecognized key");
      }
    });

    it("CARS-UC-N006: Nieprawidłowy typ", () => {
      const input = { name: 123 };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });
  });

  describe("Warunki brzegowe", () => {
    it("CARS-UC-E001: Tylko undefined fields", () => {
      const input = { name: undefined };
      const result = updateCarCommandSchema.safeParse(input);

      // undefined fields are stripped, so this behaves like empty object in refine check
      expect(result.success).toBe(true);
    });

    it("CARS-UC-E002: null jako wartość", () => {
      const input = { name: null };
      const result = updateCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });
  });
});

// ============================================================================
// deleteCarCommandSchema Tests
// ============================================================================

describe("deleteCarCommandSchema", () => {
  describe("Scenariusze pozytywne", () => {
    it("CARS-DC-001: Prawidłowa nazwa potwierdzająca", () => {
      const input = { confirmation_name: "Audi A4" };
      const result = deleteCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confirmation_name).toBe("Audi A4");
      }
    });

    it("CARS-DC-002: Nazwa z trim", () => {
      const input = { confirmation_name: "  Audi A4  " };
      const result = deleteCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confirmation_name).toBe("Audi A4");
      }
    });

    it("CARS-DC-003: Nazwa ze znakami specjalnymi", () => {
      const input = { confirmation_name: "BMW X5 (2020)" };
      const result = deleteCarCommandSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe("Scenariusze negatywne", () => {
    it("CARS-DC-N001: Brak pola", () => {
      const input = {};
      const result = deleteCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Required");
      }
    });

    it("CARS-DC-N002: Pusty string", () => {
      const input = { confirmation_name: "" };
      const result = deleteCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 1 character");
      }
    });

    it("CARS-DC-N003: Pusty string po trim", () => {
      const input = { confirmation_name: "   " };
      const result = deleteCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 1 character");
      }
    });

    it("CARS-DC-N004: Nazwa za długa", () => {
      const input = { confirmation_name: "A".repeat(101) };
      const result = deleteCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at most 100 character");
      }
    });

    it("CARS-DC-N005: Nieprawidłowy typ", () => {
      const input = { confirmation_name: 123 };
      const result = deleteCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Expected");
      }
    });

    it("CARS-DC-N006: Dodatkowe pola (strict mode)", () => {
      const input = { confirmation_name: "Test", extra: "field" };
      const result = deleteCarCommandSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Unrecognized key");
      }
    });
  });
});
