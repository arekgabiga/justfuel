import { describe, it, expect } from 'vitest';
import {
  listFillupsQuerySchema,
  fillupIdParamSchema,
  createFillupRequestSchema,
  updateFillupRequestSchema,
} from './fillups';

// ============================================================================
// listFillupsQuerySchema Tests
// ============================================================================

describe('listFillupsQuerySchema', () => {
  describe('Scenariusze pozytywne', () => {
    it('FILLUPS-LQ-001: Domyślne wartości', () => {
      const input = {};
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ limit: 20, sort: 'date', order: 'desc' });
      }
    });

    it('FILLUPS-LQ-002: Custom limit', () => {
      const input = { limit: '10' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('FILLUPS-LQ-003: Z kursorem', () => {
      const input = { cursor: 'encoded_cursor_123' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('encoded_cursor_123');
      }
    });

    it('FILLUPS-LQ-004: Sortowanie po odometer rosnąco', () => {
      const input = { sort: 'odometer', order: 'asc' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ limit: 20, sort: 'odometer', order: 'asc' });
      }
    });

    it('FILLUPS-LQ-005: Maksymalny limit', () => {
      const input = { limit: '100' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it('FILLUPS-LQ-006: Minimalny limit', () => {
      const input = { limit: '1' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });
  });

  describe('Scenariusze negatywne', () => {
    it('FILLUPS-LQ-N001: Limit = 0', () => {
      const input = { limit: '0' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than or equal to 1');
      }
    });

    it('FILLUPS-LQ-N002: Limit > 100', () => {
      const input = { limit: '101' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than or equal to 100');
      }
    });

    it('FILLUPS-LQ-N003: Limit ujemny', () => {
      const input = { limit: '-5' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than or equal to 1');
      }
    });

    it('FILLUPS-LQ-N004: Limit jako float (string)', () => {
      const input = { limit: '10.5' };
      const result = listFillupsQuerySchema.safeParse(input);

      // parseInt converts "10.5" to 10, which is valid
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('FILLUPS-LQ-N005: Limit jako nieprawidłowy string', () => {
      const input = { limit: 'abc' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('number');
      }
    });

    it('FILLUPS-LQ-N006: Nieprawidłowa wartość sort', () => {
      const input = { sort: 'invalid' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid enum value');
      }
    });

    it('FILLUPS-LQ-N007: Nieprawidłowa wartość order', () => {
      const input = { order: 'invalid' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid enum value');
      }
    });

    it('FILLUPS-LQ-N008: Dodatkowe pola (strict mode)', () => {
      const input = { limit: '20', extra: 'field' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Unrecognized key');
      }
    });
  });

  describe('Warunki brzegowe', () => {
    it('FILLUPS-LQ-E001: Pusty cursor', () => {
      const input = { cursor: '' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('');
      }
    });

    it('FILLUPS-LQ-E002: Cursor jako null', () => {
      const input = { cursor: null };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Expected');
      }
    });

    it('FILLUPS-LQ-E003: Limit jako Infinity (string)', () => {
      const input = { limit: 'Infinity' };
      const result = listFillupsQuerySchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// fillupIdParamSchema Tests
// ============================================================================

describe('fillupIdParamSchema', () => {
  describe('Scenariusze pozytywne', () => {
    it('FILLUPS-FP-001: Prawidłowy UUID v4', () => {
      const input = { fillupId: '123e4567-e89b-12d3-a456-426614174000' };
      const result = fillupIdParamSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-FP-002: UUID z małymi literami', () => {
      const input = { fillupId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' };
      const result = fillupIdParamSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('Scenariusze negatywne', () => {
    it('FILLUPS-FP-N001: Nieprawidłowy UUID', () => {
      const input = { fillupId: 'invalid-uuid' };
      const result = fillupIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid uuid');
      }
    });

    it('FILLUPS-FP-N002: Pusty string', () => {
      const input = { fillupId: '' };
      const result = fillupIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid uuid');
      }
    });

    it('FILLUPS-FP-N003: Brak pola', () => {
      const input = {};
      const result = fillupIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Required');
      }
    });

    it('FILLUPS-FP-N004: Dodatkowe pola (strict mode)', () => {
      const input = { fillupId: '123e4567-e89b-12d3-a456-426614174000', extra: 'field' };
      const result = fillupIdParamSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Unrecognized key');
      }
    });
  });
});

// ============================================================================
// createFillupRequestSchema Tests
// ============================================================================

describe('createFillupRequestSchema', () => {
  describe('Scenariusze pozytywne - Metoda Odometer', () => {
    it('FILLUPS-CR-001: Prawidłowe tankowanie z odometer', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300.5,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-CR-002: Odometer = 0', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300.5,
        odometer: 0,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-CR-003: Bardzo duże wartości', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 1000,
        total_price: 10000,
        odometer: 999999,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-CR-004: Małe wartości dziesiętne', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 0.01,
        total_price: 0.01,
        odometer: 100,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('Scenariusze pozytywne - Metoda Distance', () => {
    it('FILLUPS-CR-005: Prawidłowe tankowanie z distance', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300.5,
        distance: 500,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-CR-006: Distance jako float', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300.5,
        distance: 500.5,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-CR-007: Bardzo mały distance', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300.5,
        distance: 0.1,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('Scenariusze negatywne - Walidacja Pól', () => {
    it('FILLUPS-CR-N001: Brak daty', () => {
      const input = { fuel_amount: 45.5, total_price: 300, odometer: 50000 };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Required');
      }
    });

    it('FILLUPS-CR-N002: Nieprawidłowa data (nie ISO 8601)', () => {
      const input = {
        date: '2024-01-15',
        fuel_amount: 45.5,
        total_price: 300,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO 8601');
      }
    });

    it('FILLUPS-CR-N003: Data jako nieprawidłowy format', () => {
      const input = {
        date: '15/01/2024',
        fuel_amount: 45.5,
        total_price: 300,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO 8601');
      }
    });

    it('FILLUPS-CR-N004: Brak fuel_amount', () => {
      const input = { date: '2024-01-15T10:30:00Z', total_price: 300, odometer: 50000 };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Required');
      }
    });

    it('FILLUPS-CR-N005: fuel_amount = 0', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 0,
        total_price: 300,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-CR-N006: fuel_amount ujemny', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: -10,
        total_price: 300,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-CR-N007: Brak total_price', () => {
      const input = { date: '2024-01-15T10:30:00Z', fuel_amount: 45.5, odometer: 50000 };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Required');
      }
    });

    it('FILLUPS-CR-N008: total_price = 0', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 0,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-CR-N009: total_price ujemny', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: -100,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-CR-N010: odometer ujemny', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300,
        odometer: -100,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('non-negative');
      }
    });

    it('FILLUPS-CR-008: odometer jako float (akceptowalne)', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300,
        odometer: 50000.5,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.odometer).toBe(50000.5);
      }
    });

    it('FILLUPS-CR-N012: distance = 0', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300,
        distance: 0,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-CR-N013: distance ujemny', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300,
        distance: -100,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });
  });

  describe('Scenariusze negatywne - Wzajemna Wyłączność', () => {
    it('FILLUPS-CR-N014: Brak odometer i distance', () => {
      const input = { date: '2024-01-15T10:30:00Z', fuel_amount: 45.5, total_price: 300 };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Either odometer or distance');
      }
    });

    it('FILLUPS-CR-N015: Zarówno odometer jak i distance', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300,
        odometer: 50000,
        distance: 500,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Either odometer or distance');
      }
    });
  });

  describe('Warunki brzegowe', () => {
    it('FILLUPS-CR-E001: fuel_amount = Infinity', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: Infinity,
        total_price: 300,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      // Zod.positive() accepts Infinity as it is > 0
      expect(result.success).toBe(true);
    });

    it('FILLUPS-CR-E002: fuel_amount = NaN', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: NaN,
        total_price: 300,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('FILLUPS-CR-E003: total_price = Infinity', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: Infinity,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      // Zod.positive() accepts Infinity as it is > 0
      expect(result.success).toBe(true);
    });

    it('FILLUPS-CR-E004: odometer = MAX_SAFE_INTEGER', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300,
        odometer: Number.MAX_SAFE_INTEGER,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-CR-E005: Dodatkowe pola (strict mode)', () => {
      const input = {
        date: '2024-01-15T10:30:00Z',
        fuel_amount: 45.5,
        total_price: 300,
        odometer: 50000,
        extra: 'field',
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Unrecognized key');
      }
    });

    it('FILLUPS-CR-E006: Data z timezone offset', () => {
      const input = {
        date: '2024-01-15T10:30:00+01:00',
        fuel_amount: 45.5,
        total_price: 300,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      // Zod datetime() with offset requires UTC format
      expect(result.success).toBe(false);
    });

    it('FILLUPS-CR-E007: Data z milisekundami', () => {
      const input = {
        date: '2024-01-15T10:30:00.123Z',
        fuel_amount: 45.5,
        total_price: 300,
        odometer: 50000,
      };
      const result = createFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// updateFillupRequestSchema Tests
// ============================================================================

describe('updateFillupRequestSchema', () => {
  describe('Scenariusze pozytywne', () => {
    it('FILLUPS-UR-001: Aktualizacja tylko daty', () => {
      const input = { date: '2024-01-16T10:00:00Z' };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-UR-002: Aktualizacja tylko fuel_amount', () => {
      const input = { fuel_amount: 50.0 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-UR-003: Aktualizacja tylko total_price', () => {
      const input = { total_price: 350.0 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-UR-004: Aktualizacja tylko odometer', () => {
      const input = { odometer: 51000 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-UR-005: Aktualizacja tylko distance', () => {
      const input = { distance: 550 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-UR-006: Aktualizacja wielu pól (bez odometer/distance)', () => {
      const input = { date: '2024-01-16T10:00:00Z', fuel_amount: 50, total_price: 350 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('FILLUPS-UR-007: Pusty obiekt', () => {
      const input = {};
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('Scenariusze negatywne', () => {
    it('FILLUPS-UR-N001: Nieprawidłowa data', () => {
      const input = { date: '2024-01-15' };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO 8601');
      }
    });

    it('FILLUPS-UR-N002: fuel_amount = 0', () => {
      const input = { fuel_amount: 0 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-UR-N003: fuel_amount ujemny', () => {
      const input = { fuel_amount: -10 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-UR-N004: total_price = 0', () => {
      const input = { total_price: 0 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-UR-N005: total_price ujemny', () => {
      const input = { total_price: -100 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-UR-N006: odometer ujemny', () => {
      const input = { odometer: -100 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('non-negative');
      }
    });

    it('FILLUPS-UR-008: odometer jako float (akceptowalne)', () => {
      const input = { odometer: 50000.5 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.odometer).toBe(50000.5);
      }
    });

    it('FILLUPS-UR-N008: distance = 0', () => {
      const input = { distance: 0 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-UR-N009: distance ujemny', () => {
      const input = { distance: -100 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('FILLUPS-UR-N010: Zarówno odometer jak i distance', () => {
      const input = { odometer: 50000, distance: 500 };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be provided at the same time');
      }
    });
  });

  describe('Warunki brzegowe', () => {
    it('FILLUPS-UR-E001: Dodatkowe pola (strict mode)', () => {
      const input = { fuel_amount: 50, extra: 'field' };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Unrecognized key');
      }
    });

    it('FILLUPS-UR-E002: Wszystkie pola jako undefined', () => {
      const input = { date: undefined, fuel_amount: undefined };
      const result = updateFillupRequestSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });
});
