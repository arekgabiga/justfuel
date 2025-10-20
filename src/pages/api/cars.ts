export const prerender = false;

import type { APIRoute } from "astro";
import type { ListResponseDTO, ErrorResponseDTO } from "../../types.ts";
import { listUserCarsWithStats } from "../../lib/services/cars.service.ts";
import { listCarsQuerySchema } from "../../lib/validation/cars.ts";
import { DEFAULT_USER_ID } from "../../db/supabase.client.ts";

export const GET: APIRoute = async (context) => {
  const requestId = context.request.headers.get("x-request-id") ?? undefined;

  const supabase = context.locals.supabase;
  if (!supabase) {
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Supabase client not available" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }

  const authHeader = context.request.headers.get("authorization");
  const devAuthFallbackEnabled = import.meta.env.DEV_AUTH_FALLBACK === "true";
  const hasBearer = !!authHeader && authHeader.toLowerCase().startsWith("bearer ");
  if (!hasBearer && !devAuthFallbackEnabled) {
    const body: ErrorResponseDTO = {
      error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" },
    };
    return new Response(JSON.stringify(body), { status: 401 });
  }

  const url = new URL(context.request.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());

  const parsed = listCarsQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    const body: ErrorResponseDTO = {
      error: { code: "BAD_REQUEST", message: "Invalid query parameters", details: { issues: parsed.error.message } },
    };
    return new Response(JSON.stringify(body), { status: 400 });
  }

  try {
    const cars = await listUserCarsWithStats(
      supabase,
      parsed.data,
      !hasBearer && devAuthFallbackEnabled ? { userId: DEFAULT_USER_ID } : undefined
    );
    const body: ListResponseDTO<Awaited<ReturnType<typeof listUserCarsWithStats>>[number]> = {
      data: cars,
    };
    return new Response(JSON.stringify(body), { status: 200 });
  } catch (error) {
    console.error(`[GET /api/cars] requestId=${requestId ?? "-"}`, error);
    const body: ErrorResponseDTO = {
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error" },
    };
    return new Response(JSON.stringify(body), { status: 500 });
  }
};
