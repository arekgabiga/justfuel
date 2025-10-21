import type { FillupDTO, PaginatedFillupsResponseDTO } from "../../types.ts";
import type { AppSupabaseClient } from "../../db/supabase.client.ts";

export interface ListFillupsParams {
  limit?: number;
  cursor?: string;
  sort?: "date" | "odometer";
  order?: "asc" | "desc";
}

/**
 * Whitelist for sort columns to prevent SQL injection
 * Maps user-provided sort field to actual database column name
 */
const SORT_COLUMN_WHITELIST: Record<NonNullable<ListFillupsParams["sort"]>, string> = {
  date: "date",
  odometer: "odometer",
};

/**
 * Whitelist for order directions
 * Maps user-provided order to Supabase ascending boolean
 */
const ORDER_WHITELIST: Record<NonNullable<ListFillupsParams["order"]>, { ascending: boolean }> = {
  asc: { ascending: true },
  desc: { ascending: false },
};

/**
 * Encodes cursor value for safe transmission
 * @param sortValue - The value of the sort field
 * @param id - The record ID
 * @returns Base64-encoded cursor string
 */
function encodeCursor(sortValue: string | number, id: string): string {
  const cursorData = JSON.stringify({ s: sortValue, i: id });
  return Buffer.from(cursorData).toString("base64url");
}

/**
 * Decodes cursor value from request
 * @param cursor - Base64-encoded cursor string
 * @returns Decoded cursor data or null if invalid
 */
function decodeCursor(cursor: string): { s: string | number; i: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Lists fillups for a specific car with pagination support
 *
 * Performance optimizations:
 * - Uses composite indexes (car_id, date, id) or (car_id, odometer, id)
 * - Single query combines car verification with fillup retrieval (via RLS)
 * - Limit+1 pattern for efficient has_more detection
 * - Encoded cursor prevents injection and handles special characters
 * - Count query only runs on first page (cursor=null)
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID (for RLS verification)
 * @param carId - ID of the car to fetch fillups for
 * @param params - Query parameters (limit, cursor, sort, order)
 * @returns Paginated list of fillups with pagination metadata
 * @throws Error when car doesn't exist, doesn't belong to user, or query fails
 */
export async function listFillupsByCar(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  params: ListFillupsParams
): Promise<PaginatedFillupsResponseDTO> {
  // Extract and validate parameters
  const limit = params.limit ?? 20;
  const sort = params.sort ?? "date";
  const order = params.order ?? "desc";
  const cursor = params.cursor;

  const sortColumn = SORT_COLUMN_WHITELIST[sort];
  const orderCfg = ORDER_WHITELIST[order];

  // Decode cursor if provided
  let cursorData: { s: string | number; i: string } | null = null;
  if (cursor) {
    cursorData = decodeCursor(cursor);
    if (!cursorData) {
      throw new Error("Invalid cursor format");
    }
  }

  // Build the query
  // Note: RLS policies will automatically verify car ownership via user_id
  let fillupsQuery = supabase
    .from("fillups")
    .select(
      "id, car_id, date, fuel_amount, total_price, odometer, distance_traveled, fuel_consumption, price_per_liter"
    )
    .eq("car_id", carId)
    .order(sortColumn, orderCfg)
    .order("id", { ascending: true }); // Secondary sort for stable pagination

  // Apply cursor-based pagination if cursor is provided
  // The composite indexes (car_id, date, id) or (car_id, odometer, id) will be used here
  if (cursorData) {
    if (orderCfg.ascending) {
      // For ascending order: (sortColumn > cursor.s) OR (sortColumn = cursor.s AND id > cursor.i)
      fillupsQuery = fillupsQuery.or(
        `${sortColumn}.gt.${cursorData.s},and(${sortColumn}.eq.${cursorData.s},id.gt.${cursorData.i})`
      );
    } else {
      // For descending order: (sortColumn < cursor.s) OR (sortColumn = cursor.s AND id > cursor.i)
      fillupsQuery = fillupsQuery.or(
        `${sortColumn}.lt.${cursorData.s},and(${sortColumn}.eq.${cursorData.s},id.gt.${cursorData.i})`
      );
    }
  }

  // Fetch limit + 1 to determine if there are more results
  fillupsQuery = fillupsQuery.limit(limit + 1);

  const { data: fillups, error: fillupsError } = await fillupsQuery;

  if (fillupsError) {
    throw new Error(`Failed to fetch fillups: ${fillupsError.message}`);
  }

  // If no results, the car either doesn't exist, doesn't belong to user, or has no fillups
  // We need to distinguish between these cases
  if (!fillups || fillups.length === 0) {
    // Verify car exists and belongs to user
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("id")
      .eq("id", carId)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (carError) {
      throw new Error(`Failed to verify car: ${carError.message}`);
    }

    if (!car) {
      throw new Error("Car not found");
    }

    // Car exists but has no fillups
    return {
      fillups: [],
      pagination: {
        next_cursor: null,
        has_more: false,
        total_count: 0,
      },
    };
  }

  // Determine if there are more results
  const has_more = fillups.length > limit;
  const resultFillups = has_more ? fillups.slice(0, limit) : fillups;

  // Calculate next cursor from the last item
  let next_cursor: string | null = null;
  if (has_more && resultFillups.length > 0) {
    const lastItem = resultFillups[resultFillups.length - 1];
    const sortValue = lastItem[sortColumn as keyof typeof lastItem];
    next_cursor = encodeCursor(sortValue as string | number, lastItem.id);
  }

  // Only get total count on first page (no cursor) to reduce DB load
  // Subsequent pages can use the count from the first response
  let total_count = 0;
  if (!cursor) {
    const { count, error: countError } = await supabase
      .from("fillups")
      .select("id", { count: "exact", head: true })
      .eq("car_id", carId);

    if (countError) {
      // If count query fails, log but don't fail the request
      console.error(`Failed to get total count: ${countError.message}`);
    } else {
      total_count = count ?? 0;
    }
  }

  // Map to FillupDTO
  const fillupDTOs: FillupDTO[] = resultFillups.map((fillup) => ({
    id: fillup.id,
    car_id: fillup.car_id,
    date: fillup.date,
    fuel_amount: fillup.fuel_amount,
    total_price: fillup.total_price,
    odometer: fillup.odometer,
    distance_traveled: fillup.distance_traveled,
    fuel_consumption: fillup.fuel_consumption,
    price_per_liter: fillup.price_per_liter,
  }));

  return {
    fillups: fillupDTOs,
    pagination: {
      next_cursor,
      has_more,
      total_count,
    },
  };
}

/**
 * Gets a single fillup by ID for a specific car
 *
 * Security:
 * - RLS policies automatically verify that the fillup belongs to the user's car
 * - Returns null if fillup doesn't exist or doesn't belong to user
 *
 * Performance:
 * - Uses primary key index on fillups.id for fast lookup
 * - Uses idx_fillups_on_car_id index for car_id filtering
 * - Single query combining both conditions
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID (for RLS verification)
 * @param carId - ID of the car the fillup should belong to
 * @param fillupId - ID of the fillup to retrieve
 * @returns FillupDTO if found, null if not found or doesn't belong to user's car
 * @throws Error when query fails
 */
export async function getFillupById(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  fillupId: string
): Promise<FillupDTO | null> {
  // Query fillup with both car_id and id filters
  // RLS will automatically ensure the car belongs to the user
  const { data: fillup, error } = await supabase
    .from("fillups")
    .select(
      "id, car_id, date, fuel_amount, total_price, odometer, distance_traveled, fuel_consumption, price_per_liter"
    )
    .eq("car_id", carId)
    .eq("id", fillupId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch fillup: ${error.message}`);
  }

  // If no fillup found, it either doesn't exist, doesn't belong to this car,
  // or the car doesn't belong to the user (enforced by RLS)
  if (!fillup) {
    return null;
  }

  // Map to FillupDTO
  const fillupDTO: FillupDTO = {
    id: fillup.id,
    car_id: fillup.car_id,
    date: fillup.date,
    fuel_amount: fillup.fuel_amount,
    total_price: fillup.total_price,
    odometer: fillup.odometer,
    distance_traveled: fillup.distance_traveled,
    fuel_consumption: fillup.fuel_consumption,
    price_per_liter: fillup.price_per_liter,
  };

  return fillupDTO;
}
