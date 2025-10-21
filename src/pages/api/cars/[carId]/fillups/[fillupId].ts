export const prerender = false;

import type { APIRoute } from "astro";
import { carIdParamSchema } from "../../../../../lib/validation/cars.ts";
import { fillupIdParamSchema } from "../../../../../lib/validation/fillups.ts";
import { getFillupById } from "../../../../../lib/services/fillups.service.ts";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client.ts";
import type { ErrorResponseDTO } from "../../../../../types.ts";

/**
 * GET /api/cars/{carId}/fillups/{fillupId}
 *
 * Retrieves detailed information about a specific fillup for a car
 *
 * Path Parameters:
 * - carId: UUID - The ID of the car
 * - fillupId: UUID - The ID of the fillup to retrieve
 *
 * Responses:
 * - 200: Success with fillup data (FillupDTO)
 * - 400: Bad Request - Invalid UUID format for carId or fillupId
 * - 401: Unauthorized - Missing or invalid authentication
 * - 404: Not Found - Fillup doesn't exist, doesn't belong to car, or car doesn't belong to user
 * - 500: Internal Server Error
 */
export const GET: APIRoute = async (context) => {
  const requestId = context.request.headers.get("x-request-id") ?? undefined;

  try {
    // 1. Extract supabase client and check authentication
    const supabase = context.locals.supabase;
    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Supabase client not available",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check for Bearer token or dev fallback
    const authHeader = context.request.headers.get("authorization");
    const hasBearer = !!authHeader && authHeader.toLowerCase().startsWith("bearer ");
    const devAuthFallbackEnabled = import.meta.env.DEV_AUTH_FALLBACK === "true";

    if (!hasBearer && !devAuthFallbackEnabled) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid Authorization header",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract and validate user ID
    let userId: string | undefined;
    if (hasBearer) {
      const token = authHeader!.slice(7);
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user?.id) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid token",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      userId = data.user.id;
    } else {
      // Use dev fallback user
      userId = DEFAULT_USER_ID;
    }

    // 2. Validate path parameters - carId
    const carIdValue = Array.isArray(context.params.carId) ? context.params.carId[0] : context.params.carId;

    const carIdValidation = carIdParamSchema.safeParse({
      carId: carIdValue,
    });

    if (!carIdValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_CAR_ID",
          message: "Invalid car ID format",
          details: { issues: carIdValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { carId } = carIdValidation.data;

    // 3. Validate path parameters - fillupId
    const fillupIdValue = Array.isArray(context.params.fillupId) ? context.params.fillupId[0] : context.params.fillupId;

    const fillupIdValidation = fillupIdParamSchema.safeParse({
      fillupId: fillupIdValue,
    });

    if (!fillupIdValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_FILLUP_ID",
          message: "Invalid fillup ID format",
          details: { issues: fillupIdValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { fillupId } = fillupIdValidation.data;

    // 4. Call service to fetch fillup
    const fillup = await getFillupById(supabase, userId, carId, fillupId);

    // 5. Handle not found case
    if (!fillup) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "FILLUP_NOT_FOUND",
          message: "Fillup not found or does not belong to the specified car",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Return success response
    return new Response(JSON.stringify(fillup), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    if (error instanceof Error) {
      console.error(`[GET /api/cars/[carId]/fillups/[fillupId]] requestId=${requestId ?? "-"}`, error);
    }

    // Generic server error response
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
