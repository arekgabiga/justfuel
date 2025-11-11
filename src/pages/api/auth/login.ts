export const prerender = false;

import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';
import { loginUser } from '../../../lib/services/auth.service.ts';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy format adresu e-mail'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

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

    const { email, password } = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt login
    const { user, session } = await loginUser(supabase, email, password);

    // Session is automatically stored in cookies by createSupabaseServerInstance
    // Return success response
    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        },
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

      if (errorName === 'InvalidCredentialsError') {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_CREDENTIALS',
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
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Wystąpił błąd podczas logowania. Spróbuj ponownie.',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

