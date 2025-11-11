export const prerender = false;

import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';
import { registerUser } from '../../../lib/services/auth.service.ts';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy format adresu e-mail'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

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

    // Attempt registration
    const result = await registerUser(supabase, email, password);

    // If email confirmation is required, session might be null
    // Return success with user info and indicate if email confirmation is needed
    return new Response(
      JSON.stringify({
        user: {
          id: result.user.id,
          email: result.user.email,
        },
        requiresEmailConfirmation: !result.session,
        message: result.session
          ? 'Rejestracja zakończona powodzeniem'
          : 'Rejestracja zakończona powodzeniem. Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.',
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

      if (errorName === 'EmailAlreadyExistsError') {
        return new Response(
          JSON.stringify({
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: error.message,
            },
          }),
          {
            status: 409,
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
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

