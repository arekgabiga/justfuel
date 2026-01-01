export const prerender = false;

import type { APIRoute } from 'astro';
import type { CarDetailsDTO, ErrorResponseDTO, DeleteResponseDTO } from '../../../types.ts';
import { getUserCarWithStats, updateCar, deleteCar, ConflictError } from '../../../lib/services/cars.service.ts';
import { carIdParamSchema, updateCarCommandSchema, deleteCarCommandSchema } from '../../../lib/validation/cars.ts';
import { requireAuth } from '../../../lib/utils/auth.ts';

export const GET: APIRoute = async (context) => {
  const requestId = context.request.headers.get('x-request-id') ?? undefined;

  try {
    // Require authentication
    const user = await requireAuth(context);
    const userId = user.id;

    const supabase = context.locals.supabase;
    if (!supabase) {
      const body: ErrorResponseDTO = {
        error: { code: 'INTERNAL_ERROR', message: 'Supabase client not available' },
      };
      return new Response(JSON.stringify(body), { status: 500 });
    }

    const paramsParsed = carIdParamSchema.safeParse({ carId: context.params.carId });
    if (!paramsParsed.success) {
      const body: ErrorResponseDTO = {
        error: { code: 'BAD_REQUEST', message: 'Invalid carId', details: { issues: paramsParsed.error.message } },
      };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    const car: CarDetailsDTO | null = await getUserCarWithStats(supabase, paramsParsed.data.carId, { userId });

    if (!car) {
      const body: ErrorResponseDTO = {
        error: { code: 'NOT_FOUND', message: 'Car not found' },
      };
      return new Response(JSON.stringify(body), { status: 404 });
    }

    return new Response(JSON.stringify(car), { status: 200 });
  } catch (error) {
    // Handle auth errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }
    console.error(`[GET /api/cars/{carId}] requestId=${requestId ?? '-'}`, error);
    const body: ErrorResponseDTO = {
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};

export const PATCH: APIRoute = async (context) => {
  const requestId = context.request.headers.get('x-request-id') ?? undefined;

  try {
    // Require authentication
    const user = await requireAuth(context);
    const userId = user.id;

    const supabase = context.locals.supabase;
    if (!supabase) {
      const body: ErrorResponseDTO = {
        error: { code: 'INTERNAL_ERROR', message: 'Supabase client not available' },
      };
      return new Response(JSON.stringify(body), { status: 500 });
    }

    // Validate carId parameter
    const paramsParsed = carIdParamSchema.safeParse({ carId: context.params.carId });
    if (!paramsParsed.success) {
      const body: ErrorResponseDTO = {
        error: { code: 'BAD_REQUEST', message: 'Invalid carId', details: { issues: paramsParsed.error.message } },
      };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      const body: ErrorResponseDTO = {
        error: { code: 'BAD_REQUEST', message: 'Invalid JSON in request body' },
      };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    const bodyParsed = updateCarCommandSchema.safeParse(requestBody);
    if (!bodyParsed.success) {
      const body: ErrorResponseDTO = {
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid request body',
          details: { issues: bodyParsed.error.message },
        },
      };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    // Update the car
    const updatedCar: CarDetailsDTO = await updateCar(supabase, userId, paramsParsed.data.carId, bodyParsed.data);

    return new Response(JSON.stringify(updatedCar), { status: 200 });
  } catch (error) {
    // Handle auth errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }
    console.error(`[PATCH /api/cars/{carId}] requestId=${requestId ?? '-'}`, error);

    // Handle specific error types
    if (error instanceof ConflictError) {
      const body: ErrorResponseDTO = {
        error: { code: 'CONFLICT', message: error.message },
      };
      return new Response(JSON.stringify(body), { status: 409 });
    }

    if (error instanceof Error) {
      if (error.message === 'Car not found or does not belong to user') {
        const body: ErrorResponseDTO = {
          error: { code: 'NOT_FOUND', message: 'Car not found' },
        };
        return new Response(JSON.stringify(body), { status: 404 });
      }
    }

    // Generic server error
    const body: ErrorResponseDTO = {
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};

export const DELETE: APIRoute = async (context) => {
  const requestId = context.request.headers.get('x-request-id') ?? undefined;

  try {
    // Require authentication
    const user = await requireAuth(context);
    const userId = user.id;

    const supabase = context.locals.supabase;
    if (!supabase) {
      const body: ErrorResponseDTO = {
        error: { code: 'INTERNAL_ERROR', message: 'Supabase client not available' },
      };
      return new Response(JSON.stringify(body), { status: 500 });
    }

    // Validate carId parameter
    const paramsParsed = carIdParamSchema.safeParse({ carId: context.params.carId });
    if (!paramsParsed.success) {
      const body: ErrorResponseDTO = {
        error: { code: 'BAD_REQUEST', message: 'Invalid carId', details: { issues: paramsParsed.error.message } },
      };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      const body: ErrorResponseDTO = {
        error: { code: 'BAD_REQUEST', message: 'Invalid JSON in request body' },
      };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    const bodyParsed = deleteCarCommandSchema.safeParse(requestBody);
    if (!bodyParsed.success) {
      const body: ErrorResponseDTO = {
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid request body',
          details: { issues: bodyParsed.error.message },
        },
      };
      return new Response(JSON.stringify(body), { status: 400 });
    }

    // Delete the car
    const result: DeleteResponseDTO = await deleteCar(supabase, userId, paramsParsed.data.carId, bodyParsed.data);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // Handle auth errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }
    console.error(`[DELETE /api/cars/{carId}] requestId=${requestId ?? '-'}`, error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Car not found') {
        const body: ErrorResponseDTO = {
          error: { code: 'NOT_FOUND', message: 'Car not found' },
        };
        return new Response(JSON.stringify(body), { status: 404 });
      }

      if (error.message === 'Confirmation name does not match car name') {
        const body: ErrorResponseDTO = {
          error: { code: 'BAD_REQUEST', message: 'Confirmation name does not match car name' },
        };
        return new Response(JSON.stringify(body), { status: 400 });
      }
    }

    // Generic server error
    const body: ErrorResponseDTO = {
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};
