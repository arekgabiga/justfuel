import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '../db/supabase.client.ts';

// Public paths - Auth pages and API endpoints
const PUBLIC_PATHS = [
  // Auth pages
  '/auth/login',
  '/auth/register',
  // Auth API endpoints
  '/api/auth/login',
  '/api/auth/register',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Skip auth check for public paths
  if (isPublicRoute(url.pathname)) {
    return next();
  }

  // Create Supabase server instance for authentication
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User is authenticated - add to locals
    locals.user = {
      email: user.email ?? undefined,
      id: user.id,
    };
    locals.isAuthenticated = true;
  } else {
    // User is not authenticated
    locals.isAuthenticated = false;
    
    // Redirect to login for protected routes
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(url.pathname)}`;
    return redirect(redirectUrl);
  }

  // Store supabase instance in locals for use in pages/endpoints
  locals.supabase = supabase;

  return next();
});
