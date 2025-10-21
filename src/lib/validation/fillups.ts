import { z } from "zod";

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
    sort: z.enum(["date", "odometer"]).optional().default("date"),
    order: z.enum(["asc", "desc"]).optional().default("desc"),
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
