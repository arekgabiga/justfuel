export const prerender = false;

import type { APIRoute } from 'astro';
import { fillupIdParamSchema, updateFillupRequestSchema } from '../../../../../lib/validation/fillups.ts';
import { carIdParamSchema } from '../../../../../lib/validation/cars.ts';
import { updateFillup, getFillupById, deleteFillup } from '../../../../../lib/services/fillups.service.ts';
import { requireAuth } from '../../../../../lib/utils/auth.ts';
import type { ErrorResponseDTO } from '../../../../../types.ts';

/**
 * GET /api/cars/{carId}/fillups/{fillupId}
 *
 * Retrieves a specific fillup for a specific car
 *
 * Path Parameters:
 * - carId: string (UUID) - ID of the car
 * - fillupId: string (UUID) - ID of the fillup to retrieve
 *
 * Responses:
 * - 200: Success with fillup data (FillupDTO)
 * - 400: Bad Request - Invalid path parameters
 * - 401: Unauthorized - Missing or invalid authentication
 * - 404: Not Found - Fillup or car doesn't exist or doesn't belong to user
 * - 500: Internal Server Error
 */
export const GET: APIRoute = async (context) => {
  const requestId = context.request.headers.get('x-request-id') ?? undefined;

  try {
    // Require authentication
    const user = await requireAuth(context);
    const userId = user.id;

    const supabase = context.locals.supabase;
    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Supabase client not available',
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate path parameters
    const carIdValue = Array.isArray(context.params.carId) ? context.params.carId[0] : context.params.carId;
    const fillupIdValue = Array.isArray(context.params.fillupId) ? context.params.fillupId[0] : context.params.fillupId;

    const carIdValidation = carIdParamSchema.safeParse({
      carId: carIdValue,
    });

    if (!carIdValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INVALID_CAR_ID',
          message: 'Invalid car ID format',
          details: { issues: carIdValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fillupIdValidation = fillupIdParamSchema.safeParse({
      fillupId: fillupIdValue,
    });

    if (!fillupIdValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INVALID_FILLUP_ID',
          message: 'Invalid fillup ID format',
          details: { issues: fillupIdValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { carId } = carIdValidation.data;
    const { fillupId } = fillupIdValidation.data;

    // 3. Call service to fetch fillup
    const result = await getFillupById(supabase, userId, carId, fillupId);

    if (!result) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'FILLUP_NOT_FOUND',
          message: "Fillup not found or does not belong to user's car",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Handle auth errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }
    // Handle known errors
    if (error instanceof Error) {
      // Car not found error
      if (error.message === 'Car not found') {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: 'CAR_NOT_FOUND',
            message: 'Car not found or does not belong to user',
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Log unexpected errors for debugging

      console.error(`[GET /api/cars/[carId]/fillups/[fillupId]] requestId=${requestId ?? '-'}`, error);
    }

    // Generic server error response
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PATCH /api/cars/{carId}/fillups/{fillupId}
 *
 * Updates an existing fillup for a specific car
 *
 * Path Parameters:
 * - carId: string (UUID) - ID of the car
 * - fillupId: string (UUID) - ID of the fillup to update
 *
 * Request Body (all fields optional):
 * - date: string (ISO 8601 timestamp) - Date of the fillup
 * - fuel_amount: number (positive) - Amount of fuel added
 * - total_price: number (positive) - Total price paid
 * - odometer: number (non-negative integer) - Odometer reading
 * - distance: number (positive) - Distance traveled
 *
 * Note: odometer and distance are mutually exclusive - only one can be provided
 *
 * Responses:
 * - 200: Success with updated fillup data and metadata (UpdatedFillupDTO)
 * - 400: Bad Request - Invalid path parameters or request body
 * - 401: Unauthorized - Missing or invalid authentication
 * - 404: Not Found - Fillup or car doesn't exist or doesn't belong to user
 * - 500: Internal Server Error
 */
export const PATCH: APIRoute = async (context) => {
  const requestId = context.request.headers.get('x-request-id') ?? undefined;

  try {
    // Require authentication
    const user = await requireAuth(context);
    const userId = user.id;

    const supabase = context.locals.supabase;
    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Supabase client not available',
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate path parameters
    const carIdValue = Array.isArray(context.params.carId) ? context.params.carId[0] : context.params.carId;
    const fillupIdValue = Array.isArray(context.params.fillupId) ? context.params.fillupId[0] : context.params.fillupId;

    const carIdValidation = carIdParamSchema.safeParse({
      carId: carIdValue,
    });

    if (!carIdValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INVALID_CAR_ID',
          message: 'Invalid car ID format',
          details: { issues: carIdValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fillupIdValidation = fillupIdParamSchema.safeParse({
      fillupId: fillupIdValue,
    });

    if (!fillupIdValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INVALID_FILLUP_ID',
          message: 'Invalid fillup ID format',
          details: { issues: fillupIdValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { carId } = carIdValidation.data;
    const { fillupId } = fillupIdValidation.data;

    // 3. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate request body with Zod schema
    const bodyValidation = updateFillupRequestSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Invalid request body',
          details: { issues: bodyValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updateData = bodyValidation.data;

    // 4. Call service to update fillup
    const result = await updateFillup(supabase, userId, carId, fillupId, updateData);

    // Log successful update

    console.log(
      `[PATCH /api/cars/[carId]/fillups/[fillupId]] requestId=${requestId ?? '-'} carId=${carId} fillupId=${fillupId} updatedFields=${Object.keys(updateData).join(',')} updatedEntries=${result.updated_entries_count} warnings=${result.warnings.length}`
    );

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Handle auth errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }
    // Handle known errors
    if (error instanceof Error) {
      // Fillup not found error
      if (error.message === 'Fillup not found') {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: 'FILLUP_NOT_FOUND',
            message: "Fillup not found or does not belong to user's car",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Car not found error
      if (error.message === 'Car not found') {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: 'CAR_NOT_FOUND',
            message: 'Car not found or does not belong to user',
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Database operation errors
      if (error.message.includes('Failed to fetch') || error.message.includes('Failed to update')) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database operation failed',
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validation errors from service
      if (error.message === 'Either odometer or distance must be provided') {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: 'INVALID_REQUEST_BODY',
            message: 'Either odometer or distance must be provided',
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Log unexpected errors for debugging

      console.error(`[PATCH /api/cars/[carId]/fillups/[fillupId]] requestId=${requestId ?? '-'}`, error);
    }

    // Generic server error response
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE /api/cars/{carId}/fillups/{fillupId}
 *
 * Deletes a specific fillup for a specific car
 *
 * Path Parameters:
 * - carId: string (UUID) - ID of the car
 * - fillupId: string (UUID) - ID of the fillup to delete
 *
 * Responses:
 * - 200: Success with deletion confirmation and updated entries count (DeleteResponseDTO)
 * - 400: Bad Request - Invalid path parameters
 * - 401: Unauthorized - Missing or invalid authentication
 * - 404: Not Found - Fillup or car doesn't exist or doesn't belong to user
 * - 500: Internal Server Error
 */
export const DELETE: APIRoute = async (context) => {
  const requestId = context.request.headers.get('x-request-id') ?? undefined;

  try {
    // Require authentication
    const user = await requireAuth(context);
    const userId = user.id;

    const supabase = context.locals.supabase;
    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Supabase client not available',
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate path parameters
    const carIdValue = Array.isArray(context.params.carId) ? context.params.carId[0] : context.params.carId;
    const fillupIdValue = Array.isArray(context.params.fillupId) ? context.params.fillupId[0] : context.params.fillupId;

    const carIdValidation = carIdParamSchema.safeParse({
      carId: carIdValue,
    });

    if (!carIdValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INVALID_CAR_ID',
          message: 'Invalid car ID format',
          details: { issues: carIdValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fillupIdValidation = fillupIdParamSchema.safeParse({
      fillupId: fillupIdValue,
    });

    if (!fillupIdValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INVALID_FILLUP_ID',
          message: 'Invalid fillup ID format',
          details: { issues: fillupIdValidation.error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { carId } = carIdValidation.data;
    const { fillupId } = fillupIdValidation.data;

    // 3. Call service to delete fillup
    const result = await deleteFillup(supabase, userId, carId, fillupId);

    // Log successful deletion

    console.log(
      `[DELETE /api/cars/[carId]/fillups/[fillupId]] requestId=${requestId ?? '-'} carId=${carId} fillupId=${fillupId} updatedEntries=${result.updated_entries_count}`
    );

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Handle auth errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }
    // Handle known errors
    if (error instanceof Error) {
      // Fillup not found error
      if (error.message === 'Fillup not found') {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: 'NOT_FOUND',
            message: "Fillup or car not found, or doesn't belong to user",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Car not found error
      if (error.message === 'Car not found') {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: 'NOT_FOUND',
            message: "Fillup or car not found, or doesn't belong to user",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Database operation errors
      if (
        error.message.includes('Failed to fetch') ||
        error.message.includes('Failed to delete') ||
        error.message.includes('Failed to update')
      ) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred while deleting fillup',
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Log unexpected errors for debugging

      console.error(`[DELETE /api/cars/[carId]/fillups/[fillupId]] requestId=${requestId ?? '-'}`, error);
    }

    // Generic server error response
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while deleting fillup',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
