export const prerender = false;

import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';
import { logoutUser } from '../../../lib/services/auth.service.ts';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt logout
    await logoutUser(supabase);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Wylogowano pomyślnie',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    // Handle errors
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
          },
        );
      }
    }

    // Generic error
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

