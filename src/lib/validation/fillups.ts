import { z } from 'zod';

// ----------------------------------------------------------------------------
// Query params validation
// ----------------------------------------------------------------------------

/**
 * Zod schema for validating GET /api/cars/{carId}/fillups query parameters
 * Enforces limits, pagination cursor, sort field, and order
 */
export const listFillupsQuerySchema = z
  .object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .pipe(z.number().int().min(1).max(100)),
    cursor: z.string().optional(),
    sort: z.enum(['date', 'odometer']).optional().default('date'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  })
  .strict();

export type ListFillupsQueryInput = z.infer<typeof listFillupsQuerySchema>;

// ----------------------------------------------------------------------------
// Route params validation
// ----------------------------------------------------------------------------

/**
 * Zod schema for validating fillupId path parameter
 * Used in GET /api/cars/{carId}/fillups/{fillupId}
 */
export const fillupIdParamSchema = z
  .object({
    fillupId: z.string().uuid(),
  })
  .strict();

export type FillupIdParamInput = z.infer<typeof fillupIdParamSchema>;

// ----------------------------------------------------------------------------
// Request body validation
// ----------------------------------------------------------------------------

/**
 * Zod schema for validating POST /api/cars/{carId}/fillups request body
 * Supports two mutually exclusive input methods:
 * 1. With odometer reading (system calculates distance)
 * 2. With distance traveled (system calculates odometer)
 */
export const createFillupRequestSchema = z
  .object({
    date: z.string().datetime({ message: 'Date must be a valid ISO 8601 timestamp' }),
    fuel_amount: z.number().positive({ message: 'Fuel amount must be positive' }),
    total_price: z.number().positive({ message: 'Total price must be positive' }),
    odometer: z.number().int().min(0, { message: 'Odometer must be a non-negative integer' }).optional(),
    distance: z.number().positive({ message: 'Distance must be positive' }).optional(),
  })
  .strict()
  .refine((data) => (data.odometer !== undefined) !== (data.distance !== undefined), {
    message: 'Either odometer or distance must be provided, but not both',
    path: ['odometer', 'distance'],
  });

export type CreateFillupRequestInput = z.infer<typeof createFillupRequestSchema>;

/**
 * Zod schema for validating PATCH /api/cars/{carId}/fillups/{fillupId} request body
 * All fields are optional for partial updates
 * Supports two mutually exclusive input methods:
 * 1. With odometer reading (system calculates distance)
 * 2. With distance traveled (system calculates odometer)
 */
export const updateFillupRequestSchema = z
  .object({
    date: z.string().datetime({ message: 'Date must be a valid ISO 8601 timestamp' }).optional(),
    fuel_amount: z.number().positive({ message: 'Fuel amount must be positive' }).optional(),
    total_price: z.number().positive({ message: 'Total price must be positive' }).optional(),
    odometer: z.number().int().min(0, { message: 'Odometer must be a non-negative integer' }).optional(),
    distance: z.number().positive({ message: 'Distance must be positive' }).optional(),
  })
  .strict()
  .refine(
    (data) => {
      // If both odometer and distance are provided, it's invalid
      if (data.odometer !== undefined && data.distance !== undefined) {
        return false;
      }
      return true;
    },
    {
      message: 'Odometer and distance cannot be provided at the same time',
      path: ['odometer', 'distance'],
    }
  );

export type UpdateFillupRequestInput = z.infer<typeof updateFillupRequestSchema>;
