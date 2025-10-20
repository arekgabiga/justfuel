export const prerender = false;

import type { APIRoute } from "astro";
import type { CarDetailsDTO, ErrorResponseDTO } from "../../../types.ts";
import { getUserCarWithStats, updateCar, ConflictError } from "../../../lib/services/cars.service.ts";
import { carIdParamSchema, updateCarCommandSchema } from "../../../lib/validation/cars.ts";
import { DEFAULT_USER_ID } from "../../../db/supabase.client.ts";

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
  const hasBearer = !!authHeader && authHeader.toLowerCase().startsWith("bearer ");
  const devAuthFallbackEnabled = import.meta.env.DEV_AUTH_FALLBACK === "true";
  if (!hasBearer && !devAuthFallbackEnabled) {
    const body: ErrorResponseDTO = {
      error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" },
    };
    return new Response(JSON.stringify(body), { status: 401 });
  }

  const paramsParsed = carIdParamSchema.safeParse({ carId: context.params.carId });
  if (!paramsParsed.success) {
    const body: ErrorResponseDTO = {
      error: { code: "BAD_REQUEST", message: "Invalid carId", details: { issues: paramsParsed.error.message } },
    };
    return new Response(JSON.stringify(body), { status: 400 });
  }

  try {
    // Prefer explicit userId when available, else rely on RLS with dev fallback user filter
    let userId: string | undefined = undefined;
    if (hasBearer) {
      const token = authHeader!.slice(7);
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user?.id) {
        const body: ErrorResponseDTO = {
          error: { code: "UNAUTHORIZED", message: "Invalid token" },
        };
        return new Response(JSON.stringify(body), { status: 401 });
      }
      userId = data.user.id;
    } else if (devAuthFallbackEnabled) {
      userId = DEFAULT_USER_ID;
    }

    const car: CarDetailsDTO | null = await getUserCarWithStats(
      supabase,
      paramsParsed.data.carId,
      userId ? { userId } : undefined
    );

    if (!car) {
      const body: ErrorResponseDTO = {
        error: { code: "NOT_FOUND", message: "Car not found" },
      };
      return new Response(JSON.stringify(body), { status: 404 });
    }

    return new Response(JSON.stringify(car), { status: 200 });
  } catch (error) {
    console.error(`[GET /api/cars/{carId}] requestId=${requestId ?? "-"}`, error);
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};

export const PATCH: APIRoute = async (context) => {
  const requestId = context.request.headers.get("x-request-id") ?? undefined;

  const supabase = context.locals.supabase;
  if (!supabase) {
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Supabase client not available" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }

  const authHeader = context.request.headers.get("authorization");
  const hasBearer = !!authHeader && authHeader.toLowerCase().startsWith("bearer ");
  const devAuthFallbackEnabled = import.meta.env.DEV_AUTH_FALLBACK === "true";
  if (!hasBearer && !devAuthFallbackEnabled) {
    const body: ErrorResponseDTO = {
      error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" },
    };
    return new Response(JSON.stringify(body), { status: 401 });
  }

  // Validate carId parameter
  const paramsParsed = carIdParamSchema.safeParse({ carId: context.params.carId });
  if (!paramsParsed.success) {
    const body: ErrorResponseDTO = {
      error: { code: "BAD_REQUEST", message: "Invalid carId", details: { issues: paramsParsed.error.message } },
    };
    return new Response(JSON.stringify(body), { status: 400 });
  }

  // Parse and validate request body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch (error) {
    const body: ErrorResponseDTO = {
      error: { code: "BAD_REQUEST", message: "Invalid JSON in request body" },
    };
    return new Response(JSON.stringify(body), { status: 400 });
  }

  const bodyParsed = updateCarCommandSchema.safeParse(requestBody);
  if (!bodyParsed.success) {
    const body: ErrorResponseDTO = {
      error: {
        code: "BAD_REQUEST",
        message: "Invalid request body",
        details: { issues: bodyParsed.error.message },
      },
    };
    return new Response(JSON.stringify(body), { status: 400 });
  }

  try {
    // Get authenticated user ID
    let userId: string | undefined = undefined;
    if (hasBearer) {
      const token = authHeader!.slice(7);
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user?.id) {
        const body: ErrorResponseDTO = {
          error: { code: "UNAUTHORIZED", message: "Invalid token" },
        };
        return new Response(JSON.stringify(body), { status: 401 });
      }
      userId = data.user.id;
    } else if (devAuthFallbackEnabled) {
      userId = DEFAULT_USER_ID;
    }

    if (!userId) {
      const body: ErrorResponseDTO = {
        error: { code: "UNAUTHORIZED", message: "User authentication required" },
      };
      return new Response(JSON.stringify(body), { status: 401 });
    }

    // Update the car
    const updatedCar: CarDetailsDTO = await updateCar(supabase, userId, paramsParsed.data.carId, bodyParsed.data);

    return new Response(JSON.stringify(updatedCar), { status: 200 });
  } catch (error) {
    console.error(`[PATCH /api/cars/{carId}] requestId=${requestId ?? "-"}`, error);

    // Handle specific error types
    if (error instanceof ConflictError) {
      const body: ErrorResponseDTO = {
        error: { code: "CONFLICT", message: error.message },
      };
      return new Response(JSON.stringify(body), { status: 409 });
    }

    if (error instanceof Error) {
      if (error.message === "Car not found or does not belong to user") {
        const body: ErrorResponseDTO = {
          error: { code: "NOT_FOUND", message: "Car not found" },
        };
        return new Response(JSON.stringify(body), { status: 404 });
      }
    }

    // Generic server error
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};
