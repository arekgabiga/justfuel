export const prerender = false;

import type { APIRoute } from "astro";
import { listFillupsQuerySchema, createFillupRequestSchema } from "../../../../lib/validation/fillups.ts";
import { carIdParamSchema } from "../../../../lib/validation/cars.ts";
import { listFillupsByCar, createFillup } from "../../../../lib/services/fillups.service.ts";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client.ts";
import type { ErrorResponseDTO, CreateFillupCommand } from "../../../../types.ts";

/**
 * GET /api/cars/{carId}/fillups
 *
 * Retrieves a paginated list of fillups for a specific car
 *
 * Query Parameters:
 * - limit: number (optional, default: 20, max: 100) - Number of results per page
 * - cursor: string (optional) - Pagination cursor for fetching next page
 * - sort: "date" | "odometer" (optional, default: "date") - Field to sort by
 * - order: "asc" | "desc" (optional, default: "desc") - Sort order
 *
 * Responses:
 * - 200: Success with paginated fillups list
 * - 400: Bad Request - Invalid query parameters
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
    const queryValidation = listFillupsQuerySchema.safeParse(queryParams);

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

    // 4. Call service to fetch fillups
    const result = await listFillupsByCar(supabase, userId, carId, {
      limit: validatedParams.limit,
      cursor: validatedParams.cursor,
      sort: validatedParams.sort,
      order: validatedParams.order,
    });

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known errors
    if (error instanceof Error) {
      // Invalid cursor format error
      if (error.message === "Invalid cursor format") {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "INVALID_CURSOR",
            message: "Invalid pagination cursor",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Car not found error
      if (error.message === "Car not found") {
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

      // Log unexpected errors for debugging
      console.error(`[GET /api/cars/[carId]/fillups] requestId=${requestId ?? "-"}`, error);
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

/**
 * POST /api/cars/{carId}/fillups
 *
 * Creates a new fillup for a specific car
 *
 * Request Body:
 * - date: string (ISO 8601 timestamp) - Date of the fillup
 * - fuel_amount: number (positive) - Amount of fuel added
 * - total_price: number (positive) - Total price paid
 * - odometer: number (optional) - Odometer reading (mutually exclusive with distance)
 * - distance: number (optional) - Distance traveled (mutually exclusive with odometer)
 *
 * Responses:
 * - 201: Success with created fillup data and validation warnings (FillupWithWarningsDTO)
 * - 400: Bad Request - Invalid request body or validation errors
 * - 401: Unauthorized - Missing or invalid authentication
 * - 404: Not Found - Car doesn't exist or doesn't belong to user
 * - 500: Internal Server Error
 */
export const POST: APIRoute = async (context) => {
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

    // 3. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_JSON",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodyValidation = createFillupRequestSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Invalid request body",
          details: { issues: bodyValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedBody = bodyValidation.data;

    // 4. Call service to create fillup
    const result = await createFillup(supabase, userId, carId, validatedBody as CreateFillupCommand);

    // Log successful creation
    console.log(
      `[POST /api/cars/[carId]/fillups] requestId=${requestId ?? "-"} carId=${carId} fillupId=${result.id} warnings=${result.warnings?.length ?? 0}`
    );

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known errors
    if (error instanceof Error) {
      // Car not found error
      if (error.message === "Car not found or does not belong to user") {
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

      // Log unexpected errors for debugging
      console.error(`[POST /api/cars/[carId]/fillups] requestId=${requestId ?? "-"}`, error);
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
