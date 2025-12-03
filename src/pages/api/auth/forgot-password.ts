export const prerender = false;

import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';
import { resetPasswordForEmail } from '../../../lib/services/auth.service.ts';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy format adresu e-mail'),
});

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

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
        }
      );
    }

    const { email } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Build reset password redirect URL
    // Supabase will append the token as a hash fragment (#access_token=...)
    // Must be a full URL (not relative path) and must be in additional_redirect_urls in config.toml
    const resetPasswordUrl = new URL('/auth/reset-password', url.origin);

    // Send password reset email
    await resetPasswordForEmail(supabase, email, resetPasswordUrl.toString());

    // Always return success to prevent email enumeration
    // Supabase will send email only if account exists
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Jeśli konto z tym adresem e-mail istnieje, wysłaliśmy link do resetowania hasła.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Handle application-specific errors
    if (error instanceof Error) {
      const errorName = error.constructor.name;

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
          }
        );
      }
    }

    // Generic error
    console.error('Forgot password error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Wystąpił błąd podczas wysyłania linku resetującego. Spróbuj ponownie.',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
