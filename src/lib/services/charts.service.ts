import type { ChartDataDTO, ChartDataPointDTO, ChartMetadataDTO } from '../../types.ts';
import type { ChartQueryInput } from '../validation/charts.ts';
import type { AppSupabaseClient } from '../../db/supabase.client.ts';

/**
 * Gets chart data for a specific car and chart type
 *
 * Business Logic:
 * - Supports three chart types: consumption, price_per_liter, distance
 * - Filters data by date range if provided
 * - Limits results to prevent large responses
 * - Calculates aggregated statistics (average, min, max, count)
 * - Returns data sorted by date (newest first)
 *
 * Security:
 * - RLS policies automatically verify car ownership via user_id
 * - User can only access chart data for their own cars
 *
 * Performance:
 * - Uses existing indexes: idx_fillups_on_car_id and idx_fillups_on_date
 * - Single query with aggregation for efficient data retrieval
 * - Limits results to prevent performance issues
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID (for RLS verification)
 * @param carId - ID of the car to get chart data for
 * @param params - Chart query parameters (type, date range, limit)
 * @returns ChartDataDTO with time series data and statistics, or null if car not found
 * @throws Error when car doesn't exist, doesn't belong to user, or query fails
 */
export async function getChartData(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  params: ChartQueryInput
): Promise<ChartDataDTO | null> {
  // First, verify the car exists and belongs to the user
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id')
    .eq('id', carId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (carError) {
    throw new Error(`Failed to verify car: ${carError.message}`);
  }

  if (!car) {
    return null; // Car not found or doesn't belong to user
  }

  // Build the query for fillups data
  let fillupsQuery = supabase
    .from('fillups')
    .select('date, odometer, fuel_consumption, price_per_liter, distance_traveled')
    .eq('car_id', carId)
    .order('date', { ascending: false })
    .limit(params.limit);

  // Apply date filters if provided
  if (params.start_date) {
    fillupsQuery = fillupsQuery.gte('date', params.start_date);
  }
  if (params.end_date) {
    fillupsQuery = fillupsQuery.lte('date', params.end_date);
  }

  const { data: fillups, error: fillupsError } = await fillupsQuery;

  if (fillupsError) {
    throw new Error(`Failed to fetch fillups: ${fillupsError.message}`);
  }

  if (!fillups || fillups.length === 0) {
    // No fillups found - return empty chart data
    return {
      type: params.type,
      data: [],
      average: 0,
      metadata: {
        count: 0,
        min: 0,
        max: 0,
      },
    };
  }

  // Extract values based on chart type
  const values: number[] = [];
  const dataPoints: ChartDataPointDTO[] = [];

  for (const fillup of fillups) {
    let value: number | null = null;

    switch (params.type) {
      case 'consumption':
        value = fillup.fuel_consumption;
        break;
      case 'price_per_liter':
        value = fillup.price_per_liter;
        break;
      case 'distance':
        value = fillup.distance_traveled;
        break;
    }

    // Only include data points with valid values
    if (value !== null && value !== undefined) {
      values.push(value);
      dataPoints.push({
        date: fillup.date,
        value: value,
        odometer: fillup.odometer,
      });
    }
  }

  // Calculate statistics
  const count = values.length;
  let average = 0;
  let min = 0;
  let max = 0;

  if (count > 0) {
    average = values.reduce((sum, val) => sum + val, 0) / count;
    min = Math.min(...values);
    max = Math.max(...values);
  }

  const metadata: ChartMetadataDTO = {
    count,
    min,
    max,
  };

  return {
    type: params.type,
    data: dataPoints,
    average,
    metadata,
  };
}
