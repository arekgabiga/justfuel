export const prerender = false;

import type { APIRoute } from "astro";
import type { CarStatisticsDTO, ErrorResponseDTO } from "../../../../types.ts";
import { getCarStatistics } from "../../../../lib/services/cars.service.ts";
import { carIdParamSchema } from "../../../../lib/validation/cars.ts";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client.ts";

/**
 * GET /api/cars/{carId}/statistics
 *
 * Retrieves detailed statistics for a specific car including:
 * - Aggregated fuel costs, amounts, and distances
 * - Average consumption and price per liter
 * - Fillup count and latest fillup metadata
 *
 * @param context - Astro API context with params, locals, and request
 * @returns JSON response with CarStatisticsDTO or error
 */
export const GET: APIRoute = async (context) => {
  const requestId = context.request.headers.get("x-request-id") ?? undefined;

  // Validate Supabase client availability
  const supabase = context.locals.supabase;
  if (!supabase) {
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Supabase client not available" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }

  // Validate Authorization header
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
      error: {
        code: "BAD_REQUEST",
        message: "Invalid carId",
        details: { issues: paramsParsed.error.message },
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

    // Get car statistics using the service
    const statistics: CarStatisticsDTO | null = await getCarStatistics(
      supabase,
      paramsParsed.data.carId,
      userId ? { userId } : undefined
    );

    if (!statistics) {
      const body: ErrorResponseDTO = {
        error: { code: "NOT_FOUND", message: "Car not found" },
      };
      return new Response(JSON.stringify(body), { status: 404 });
    }

    return new Response(JSON.stringify(statistics), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(`[GET /api/cars/{carId}/statistics] requestId=${requestId ?? "-"}`, error);
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};
