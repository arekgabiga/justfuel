import { z } from 'zod';

// ----------------------------------------------------------------------------
// Car Schemas
// ----------------------------------------------------------------------------

export const listCarsQuerySchema = z
  .object({
    sort: z.enum(['name', 'created_at']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
  })
  .strict();

export const carIdParamSchema = z
  .object({
    carId: z.string().uuid(),
  })
  .strict();

export const createCarCommandSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    initial_odometer: z.number().int().nonnegative().optional(),
    mileage_input_preference: z.enum(['odometer', 'distance']),
  })
  .strict();

export const updateCarCommandSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    initial_odometer: z.number().int().nonnegative().optional(),
    mileage_input_preference: z.enum(['odometer', 'distance']).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Przynajmniej jedno pole musi zostać podane do aktualizacji',
  });

export const deleteCarCommandSchema = z
  .object({
    confirmation_name: z.string().trim().min(1).max(100),
  })
  .strict();

// ----------------------------------------------------------------------------
// Fillup Schemas
// ----------------------------------------------------------------------------

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

export const fillupIdParamSchema = z
  .object({
    fillupId: z.string().uuid(),
  })
  .strict();

export const createFillupRequestSchema = z
  .object({
    date: z.string().datetime({ message: 'Data musi być w poprawnym formacie ISO 8601' }),
    fuel_amount: z.number().positive({ message: 'Ilość paliwa musi być dodatnia' }).max(2000, { message: 'Ilość paliwa nie może przekraczać 2000L' }),
    total_price: z.number().positive({ message: 'Cena całkowita musi być dodatnia' }).max(100000, { message: 'Całkowita cena nie może przekraczać 100000 PLN' }),
    odometer: z.number().int().min(0, { message: 'Przebieg musi być liczbą nieujemną' }).optional(),
    distance: z.number().positive({ message: 'Dystans musi być dodatni' }).optional(),
  })
  .strict()
  .refine((data) => (data.odometer !== undefined) !== (data.distance !== undefined), {
    message: 'Podaj przebieg LUB dystans (nie oba naraz)',
    path: ['odometer', 'distance'],
  });

export const updateFillupRequestSchema = z
  .object({
    date: z.string().datetime({ message: 'Data musi być w poprawnym formacie ISO 8601' }).optional(),
    fuel_amount: z.number().positive({ message: 'Ilość paliwa musi być dodatnia' }).max(2000, { message: 'Ilość paliwa nie może przekraczać 2000L' }).optional(),
    total_price: z.number().positive({ message: 'Cena całkowita musi być dodatnia' }).max(100000, { message: 'Całkowita cena nie może przekraczać 100000 PLN' }).optional(),
    odometer: z.number().int().min(0, { message: 'Przebieg musi być liczbą nieujemną' }).optional(),
    distance: z.number().positive({ message: 'Dystans musi być dodatni' }).optional(),
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
      message: 'Podaj przebieg LUB dystans (nie oba naraz)',
      path: ['odometer', 'distance'],
    }
  );

// ----------------------------------------------------------------------------
// Type Inference
// ----------------------------------------------------------------------------

export type ListCarsQueryInput = z.infer<typeof listCarsQuerySchema>;
export type CarIdParamInput = z.infer<typeof carIdParamSchema>;
export type CreateCarCommandInput = z.infer<typeof createCarCommandSchema>;
export type UpdateCarCommandInput = z.infer<typeof updateCarCommandSchema>;
export type DeleteCarCommandInput = z.infer<typeof deleteCarCommandSchema>;

export type ListFillupsQueryInput = z.infer<typeof listFillupsQuerySchema>;
export type FillupIdParamInput = z.infer<typeof fillupIdParamSchema>;
export type CreateFillupRequestInput = z.infer<typeof createFillupRequestSchema>;
export type UpdateFillupRequestInput = z.infer<typeof updateFillupRequestSchema>;
