export const prerender = false;

import type { APIRoute } from "astro";
import type { ListResponseDTO, ErrorResponseDTO, CarDetailsDTO } from "../../types.ts";
import { listUserCarsWithStats, createCar, ConflictError } from "../../lib/services/cars.service.ts";
import { listCarsQuerySchema, createCarCommandSchema } from "../../lib/validation/cars.ts";
import { DEFAULT_USER_ID } from "../../db/supabase.client.ts";

export const GET: APIRoute = async (context) => {
  const requestId = context.request.headers.get("x-request-id") ?? undefined;

  const supabase = context.locals.supabase;
  if (!supabase) {
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Supabase client not available" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }

  const authHeader = context.request.headers.get("authorization");
  const devAuthFallbackEnabled = import.meta.env.DEV_AUTH_FALLBACK === "true";
  const hasBearer = !!authHeader && authHeader.toLowerCase().startsWith("bearer ");

  // Determine user ID for the request
  let userId: string | undefined;
  if (hasBearer) {
    const token = authHeader!.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) {
      // If token validation fails but dev auth fallback is enabled, use default user
      if (devAuthFallbackEnabled) {
        userId = DEFAULT_USER_ID;
      } else {
        const body: ErrorResponseDTO = {
          error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" },
        };
        return new Response(JSON.stringify(body), { status: 401 });
      }
    } else {
      userId = data.user.id;
    }
  } else {
    if (!devAuthFallbackEnabled) {
      const body: ErrorResponseDTO = {
        error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" },
      };
      return new Response(JSON.stringify(body), { status: 401 });
    }
    userId = DEFAULT_USER_ID;
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

  try {
    const cars = await listUserCarsWithStats(supabase, parsed.data, userId ? { userId } : undefined);
    const body: ListResponseDTO<Awaited<ReturnType<typeof listUserCarsWithStats>>[number]> = {
      data: cars,
    };
    return new Response(JSON.stringify(body), { status: 200 });
  } catch (error) {
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

  // Ensure Supabase client is available
  const supabase = context.locals.supabase;
  if (!supabase) {
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Supabase client not available" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }

  // Validate authentication (Bearer token or dev fallback)
  const authHeader = context.request.headers.get("authorization");
  const devAuthFallbackEnabled = import.meta.env.DEV_AUTH_FALLBACK === "true";
  const hasBearer = !!authHeader && authHeader.toLowerCase().startsWith("bearer ");

  // Extract user ID from token or use dev fallback
  let userId: string | undefined;
  if (hasBearer) {
    const token = authHeader!.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) {
      // If token validation fails but dev auth fallback is enabled, use default user
      if (devAuthFallbackEnabled) {
        userId = DEFAULT_USER_ID;
      } else {
        const body: ErrorResponseDTO = {
          error: { code: "UNAUTHORIZED", message: "Invalid token" },
        };
        return new Response(JSON.stringify(body), { status: 401 });
      }
    } else {
      userId = data.user.id;
    }
  } else {
    if (!devAuthFallbackEnabled) {
      const body: ErrorResponseDTO = {
        error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" },
      };
      return new Response(JSON.stringify(body), { status: 401 });
    }
    userId = DEFAULT_USER_ID;
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

  try {
    // Create car and return 201 with car details
    const created: CarDetailsDTO = await createCar(supabase, userId!, parsed.data);
    return new Response(JSON.stringify(created), { status: 201 });
  } catch (err) {
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
