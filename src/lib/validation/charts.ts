import { z } from 'zod';

// ----------------------------------------------------------------------------
// Chart query params validation
// ----------------------------------------------------------------------------

/**
 * Zod schema for validating GET /api/cars/{carId}/charts query parameters
 * Supports chart type, date range filtering, and result limiting
 */
export const chartQuerySchema = z
  .object({
    type: z.enum(['consumption', 'price_per_liter', 'distance']),
    start_date: z.string().datetime({ message: 'Start date must be a valid ISO 8601 timestamp' }).optional(),
    end_date: z.string().datetime({ message: 'End date must be a valid ISO 8601 timestamp' }).optional(),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 50))
      .pipe(z.number().int().min(1).max(1000)),
  })
  .strict()
  .refine(
    (data) => {
      // Validate date range if both dates are provided
      if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        return startDate <= endDate;
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['start_date'],
    }
  );

export type ChartQueryInput = z.infer<typeof chartQuerySchema>;
