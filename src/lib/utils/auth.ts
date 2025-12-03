import type { APIRoute } from 'astro';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerInstance } from '../../db/supabase.client.ts';
import { getCurrentUser } from '../services/auth.service.ts';

/**
 * Gets the authenticated user from the request context
 * Returns null if user is not authenticated
 */
export async function getUserFromRequest(context: Parameters<APIRoute>[0]): Promise<User | null> {
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  return getCurrentUser(supabase);
}

/**
 * Requires authentication for an API route
 * Throws an error response if user is not authenticated
 */
export async function requireAuth(context: Parameters<APIRoute>[0]): Promise<User> {
  const user = await getUserFromRequest(context);

  if (!user) {
    throw new Response(
      JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Wymagana autoryzacja',
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return user;
}
