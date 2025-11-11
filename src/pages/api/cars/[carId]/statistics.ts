export const prerender = false;

import type { APIRoute } from "astro";
import type { CarStatisticsDTO, ErrorResponseDTO } from "../../../../types.ts";
import { getCarStatistics } from "../../../../lib/services/cars.service.ts";
import { carIdParamSchema } from "../../../../lib/validation/cars.ts";
import { requireAuth } from "../../../../lib/utils/auth.ts";

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

    // Get car statistics using the service
    const statistics: CarStatisticsDTO | null = await getCarStatistics(
      supabase,
      paramsParsed.data.carId,
      { userId }
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
    // Handle auth errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }
    console.error(`[GET /api/cars/{carId}/statistics] requestId=${requestId ?? "-"}`, error);
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};
