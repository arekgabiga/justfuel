import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../../db/supabase.client';
import { getAllFillups } from '../../../../lib/services/fillups.service';
import { generateCsv } from '@justfuel/shared';

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const { carId } = params;

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
    const fillups = await getAllFillups(supabase, user.id, carId);
    const csv = generateCsv([...fillups].reverse());

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="justfuel_export_${carId}.csv"`,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
