import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../../db/supabase.client';
import { batchCreateFillups } from '../../../../lib/services/fillups.service';
import type { CreateFillupCommand } from '../../../../types';
import { getDateWithOffset, detectSortDirection } from '@justfuel/shared';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const { carId } = params;

  // Initialize server-side Supabase client
  const supabase = createSupabaseServerInstance({ headers: request.headers, cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!carId) {
    return new Response('Missing Car ID', { status: 400 });
  }

  try {
    const body = await request.json();
    const fillups = body.fillups as any[];

    if (!fillups || !Array.isArray(fillups)) {
      return new Response('Invalid body', { status: 400 });
    }

    // Map to Command
    const commands: CreateFillupCommand[] = fillups.map((f: any) => {
      // Determine if odometer or distance based on data presence
      // We rely on client strict validation, but types need to match union
      if (f.odometer !== undefined && f.odometer !== null) {
        return {
          date: f.date,
          fuel_amount: Number(f.fuel_amount),
          total_price: Number(f.total_price),
          price_per_liter: f.price_per_liter ? Number(f.price_per_liter) : undefined,
          odometer: Number(f.odometer),
        };
      } else {
        return {
          date: f.date,
          fuel_amount: Number(f.fuel_amount),
          total_price: Number(f.total_price),
          price_per_liter: f.price_per_liter ? Number(f.price_per_liter) : undefined,
          distance: Number(f.distance_traveled || f.distance || 0),
        };
      }
    });

    // Inject time with offset to preserve order
    const baseTime = new Date();
    const sortDirection = detectSortDirection(commands);

    commands.forEach((cmd, index) => {
      cmd.date = getDateWithOffset(cmd.date, baseTime, index, 1000, sortDirection);
    });

    await batchCreateFillups(supabase, user.id, carId, commands);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
