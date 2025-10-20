import { z } from "zod";

export const listCarsQuerySchema = z
  .object({
    sort: z.enum(["name", "created_at"]).optional().default("created_at"),
    order: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .strict();

export type ListCarsQueryInput = z.infer<typeof listCarsQuerySchema>;
