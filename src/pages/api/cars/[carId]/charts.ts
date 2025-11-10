export const prerender = false;

import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../../types.ts";
import { getChartData } from "../../../../lib/services/charts.service.ts";
import { chartQuerySchema } from "../../../../lib/validation/charts.ts";
import { carIdParamSchema } from "../../../../lib/validation/cars.ts";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client.ts";

/**
 * GET /api/cars/{carId}/charts
 *
 * Retrieves chart data for a specific car including:
 * - Time series data for consumption, price per liter, or distance
 * - Aggregated statistics (average, min, max, count)
 * - Filtered by date range if provided
 *
 * Query Parameters:
 * - type: "consumption" | "price_per_liter" | "distance" (required) - Chart type
 * - start_date: string (optional) - Start date filter (ISO 8601)
 * - end_date: string (optional) - End date filter (ISO 8601)
 * - limit: number (optional, default: 50, max: 1000) - Maximum number of data points
 *
 * Responses:
 * - 200: Success with chart data (ChartDataDTO)
 * - 400: Bad Request - Invalid query parameters or car ID
 * - 401: Unauthorized - Missing or invalid authentication
 * - 404: Not Found - Car doesn't exist or doesn't belong to user
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
      const token = authHeader.slice(7);
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user?.id) {
        // If token validation fails but dev auth fallback is enabled, use default user
        if (devAuthFallbackEnabled) {
          userId = DEFAULT_USER_ID;
        } else {
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
      } else {
        userId = data.user.id;
      }
    } else {
      // Use dev fallback user if enabled
      if (!devAuthFallbackEnabled) {
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
      userId = DEFAULT_USER_ID;
    }

    // 2. Validate path parameters
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

    // 3. Validate query parameters
    const queryParams: Record<string, string> = {};
    for (const [key, value] of context.url.searchParams.entries()) {
      queryParams[key] = value;
    }
    const queryValidation = chartQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_QUERY_PARAMS",
          message: "Invalid query parameters",
          details: { issues: queryValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedParams = queryValidation.data;

    // 4. Call service to fetch chart data
    const chartData = await getChartData(supabase, userId, carId, validatedParams);

    if (!chartData) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "CAR_NOT_FOUND",
          message: "Car not found or does not belong to user",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Return success response
    return new Response(JSON.stringify(chartData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known errors
    if (error instanceof Error) {
      // Log unexpected errors for debugging
      // eslint-disable-next-line no-console
      console.error(`[GET /api/cars/{carId}/charts] requestId=${requestId ?? "-"}`, error);
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
