import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@justfuel/shared';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Legacy client for backward compatibility (if needed)
// Note: This is kept for potential client-side usage, but server-side should use createSupabaseServerInstance
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Cookie options for SSR
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: import.meta.env.PROD, // Only secure in production
  httpOnly: true,
  sameSite: 'lax',
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// Expose the app-level Supabase client type
export type AppSupabaseClient = ReturnType<typeof createSupabaseServerInstance>;
