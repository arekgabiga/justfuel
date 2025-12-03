import { z } from 'zod';

export const listCarsQuerySchema = z
  .object({
    sort: z.enum(['name', 'created_at']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
  })
  .strict();

export type ListCarsQueryInput = z.infer<typeof listCarsQuerySchema>;

// ----------------------------------------------------------------------------
// Route params validation
// ----------------------------------------------------------------------------

export const carIdParamSchema = z
  .object({
    carId: z.string().uuid(),
  })
  .strict();

export type CarIdParamInput = z.infer<typeof carIdParamSchema>;

// ----------------------------------------------------------------------------
// Create car command validation
// ----------------------------------------------------------------------------

export const createCarCommandSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    initial_odometer: z.number().int().nonnegative().optional(),
    mileage_input_preference: z.enum(['odometer', 'distance']),
  })
  .strict();

export type CreateCarCommandInput = z.infer<typeof createCarCommandSchema>;

// ----------------------------------------------------------------------------
// Update car command validation
// ----------------------------------------------------------------------------

export const updateCarCommandSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    mileage_input_preference: z.enum(['odometer', 'distance']).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateCarCommandInput = z.infer<typeof updateCarCommandSchema>;

// ----------------------------------------------------------------------------
// Delete car command validation
// ----------------------------------------------------------------------------

export const deleteCarCommandSchema = z
  .object({
    confirmation_name: z.string().trim().min(1).max(100),
  })
  .strict();

export type DeleteCarCommandInput = z.infer<typeof deleteCarCommandSchema>;
