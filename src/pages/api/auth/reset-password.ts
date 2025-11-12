export const prerender = false;

import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';
import { updatePasswordWithToken } from '../../../lib/services/auth.service.ts';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Nieprawidłowe dane',
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { password } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check if user has an active session (required for password reset)
    // When user clicks reset link from email, Supabase automatically creates a session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token resetowania jest nieprawidłowy lub wygasł. Poproś o nowy link resetujący.',
          },
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Update password using the reset token from the session
    await updatePasswordWithToken(supabase, password);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hasło zostało zresetowane pomyślnie.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    // Handle application-specific errors
    if (error instanceof Error) {
      const errorName = error.constructor.name;

      if (errorName === 'InvalidTokenError') {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_TOKEN',
              message: error.message,
            },
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (errorName === 'SupabaseAuthError') {
        return new Response(
          JSON.stringify({
            error: {
              code: 'AUTH_ERROR',
              message: error.message,
            },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // Generic error
    console.error('Reset password error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

