export const prerender = false;

import type { APIRoute } from "astro";
import type { ListResponseDTO, ErrorResponseDTO, CarDetailsDTO } from "../../types.ts";
import { listUserCarsWithStats, createCar, ConflictError } from "../../lib/services/cars.service.ts";
import { listCarsQuerySchema, createCarCommandSchema } from "../../lib/validation/cars.ts";
import { requireAuth } from "../../lib/utils/auth.ts";

export const GET: APIRoute = async (context) => {
  const requestId = context.request.headers.get("x-request-id") ?? undefined;

  try {
    // Require authentication
    const user = await requireAuth(context);
    const userId = user.id;

    const supabase = context.locals.supabase;
    if (!supabase) {
      const body: ErrorResponseDTO = {
        error: { code: "INTERNAL_ERROR", message: "Supabase client not available" },
      };
      return new Response(JSON.stringify(body), { status: 500 });
    }

    const url = new URL(context.request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());

    const parsed = listCarsQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      const body: ErrorResponseDTO = {
        error: { code: "BAD_REQUEST", message: "Invalid query parameters", details: { issues: parsed.error.message } },
      };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    const cars = await listUserCarsWithStats(supabase, parsed.data, { userId });
    const body: ListResponseDTO<Awaited<ReturnType<typeof listUserCarsWithStats>>[number]> = {
      data: cars,
    };
    return new Response(JSON.stringify(body), { status: 200 });
  } catch (error) {
    // Handle auth errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }
    console.error(`[GET /api/cars] requestId=${requestId ?? "-"}`, error);
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};

/**
 * POST /api/cars - Create a new car for the authenticated user
 *
 * Request body: { name: string, initial_odometer?: number, mileage_input_preference: "odometer" | "distance" }
 * Response: 201 Created with CarDetailsDTO (includes zeroed statistics)
 *
 * Error responses:
 * - 400 Bad Request: Invalid request body (validation errors)
 * - 401 Unauthorized: Missing/invalid Bearer token
 * - 409 Conflict: Car name already exists for this user
 * - 500 Internal Server Error: Unexpected server error
 */
export const POST: APIRoute = async (context) => {
  const requestId = context.request.headers.get("x-request-id") ?? undefined;

  try {
    // Require authentication
    const user = await requireAuth(context);
    const userId = user.id;

    // Ensure Supabase client is available
    const supabase = context.locals.supabase;
    if (!supabase) {
      const body: ErrorResponseDTO = {
        error: { code: "INTERNAL_ERROR", message: "Supabase client not available" },
      };
      return new Response(JSON.stringify(body), { status: 500 });
    }

    // Parse and validate request body
    const rawBody = await context.request.json().catch(() => undefined);
    const parsed = createCarCommandSchema.safeParse(rawBody);
    if (!parsed.success) {
      const body: ErrorResponseDTO = {
        error: { code: "BAD_REQUEST", message: "Invalid body", details: { issues: parsed.error.message } },
      };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    // Create car and return 201 with car details
    const created: CarDetailsDTO = await createCar(supabase, userId, parsed.data);
    return new Response(JSON.stringify(created), { status: 201 });
  } catch (err) {
    // Handle auth errors (thrown by requireAuth)
    if (err instanceof Response) {
      return err;
    }
    // Handle specific error types
    if (err instanceof ConflictError) {
      const body: ErrorResponseDTO = {
        error: { code: "CONFLICT", message: "Car name already exists for this user" },
      };
      return new Response(JSON.stringify(body), { status: 409 });
    }
    // Log unexpected errors and return 500
    console.error(`[POST /api/cars] requestId=${requestId ?? "-"}`, err);
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};
