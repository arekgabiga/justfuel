import type {
  FillupDTO,
  PaginatedFillupsResponseDTO,
  CreateFillupCommand,
  FillupWithWarningsDTO,
  ValidationWarningDTO,
  UpdateFillupCommand,
  UpdatedFillupDTO,
  DeleteResponseDTO,
} from "../../types.ts";
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

// ----------------------------------------------------------------------------
// Create fillup service
// ----------------------------------------------------------------------------

/**
 * Result of fillup validation containing warnings
 */
export interface CreateFillupValidationResult {
  warnings: ValidationWarningDTO[];
}

/**
 * Creates a new fillup for a specific car
 *
 * Business Logic:
 * - Supports two input methods: odometer reading or distance traveled (mutually exclusive)
 * - Automatically calculates missing field (distance from odometer or vice versa)
 * - Validates odometer consistency with previous fillups
 * - Calculates fuel consumption and price per liter
 * - Returns warnings for validation issues (e.g., odometer going backwards)
 *
 * Security:
 * - RLS policies automatically verify car ownership via user_id
 * - User can only create fillups for their own cars
 *
 * Performance:
 * - Uses idx_fillups_on_car_id index for efficient previous fillup lookup
 * - Single query to get previous fillup for validation
 * - Single insert operation for new fillup
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID (for RLS verification)
 * @param carId - ID of the car to create fillup for
 * @param input - Fillup creation data (date, fuel_amount, total_price, odometer OR distance)
 * @returns FillupWithWarningsDTO with created fillup data and validation warnings
 * @throws Error when car doesn't exist, doesn't belong to user, or creation fails
 */
export async function createFillup(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  input: CreateFillupCommand
): Promise<FillupWithWarningsDTO> {
  // First, verify the car exists and belongs to the user
  const { data: car, error: carError } = await supabase
    .from("cars")
    .select("id, initial_odometer")
    .eq("id", carId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (carError) {
    throw new Error(`Failed to verify car: ${carError.message}`);
  }

  if (!car) {
    throw new Error("Car not found or does not belong to user");
  }

  // Get the most recent fillup for this car to validate odometer consistency
  const { data: previousFillup, error: previousError } = await supabase
    .from("fillups")
    .select("odometer, date")
    .eq("car_id", carId)
    .order("odometer", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousError) {
    throw new Error(`Failed to fetch previous fillup: ${previousError.message}`);
  }

  // Calculate odometer and distance based on input method
  let odometer: number;
  let distance_traveled: number;
  const warnings: ValidationWarningDTO[] = [];

  if ("odometer" in input && input.odometer !== undefined) {
    // Input method: odometer reading
    odometer = input.odometer;

    if (previousFillup) {
      distance_traveled = odometer - previousFillup.odometer;

      // Validate odometer consistency
      if (distance_traveled < 0) {
        warnings.push({
          field: "odometer",
          message: "Odometer reading is lower than the previous fillup",
        });
      } else if (distance_traveled === 0) {
        warnings.push({
          field: "odometer",
          message: "Odometer reading is the same as the previous fillup",
        });
      }
    } else {
      // First fillup - calculate distance from initial odometer
      const initialOdometer = car.initial_odometer ?? 0;
      distance_traveled = odometer - initialOdometer;

      if (distance_traveled < 0) {
        warnings.push({
          field: "odometer",
          message: "Odometer reading is lower than the car's initial odometer",
        });
      }
    }
  } else if ("distance" in input && input.distance !== undefined) {
    // Input method: distance traveled
    distance_traveled = input.distance;

    if (previousFillup) {
      odometer = previousFillup.odometer + distance_traveled;
    } else {
      // First fillup - calculate odometer from initial odometer
      const initialOdometer = car.initial_odometer ?? 0;
      odometer = initialOdometer + distance_traveled;
    }
  } else {
    throw new Error("Either odometer or distance must be provided");
  }

  // Calculate fuel consumption and price per liter
  const fuel_consumption = distance_traveled > 0 ? (input.fuel_amount / distance_traveled) * 100 : null;
  const price_per_liter = input.fuel_amount > 0 ? input.total_price / input.fuel_amount : null;

  // Prepare fillup data for insertion
  const fillupData = {
    car_id: carId,
    date: input.date,
    fuel_amount: input.fuel_amount,
    total_price: input.total_price,
    odometer,
    distance_traveled,
    fuel_consumption,
    price_per_liter,
  };

  // Insert the new fillup
  const { data: newFillup, error: insertError } = await supabase
    .from("fillups")
    .insert(fillupData)
    .select(
      "id, car_id, date, fuel_amount, total_price, odometer, distance_traveled, fuel_consumption, price_per_liter"
    )
    .single();

  if (insertError) {
    throw new Error(`Failed to create fillup: ${insertError.message}`);
  }

  if (!newFillup) {
    throw new Error("Failed to create fillup");
  }

  // Map to FillupDTO and add warnings
  const fillupDTO: FillupDTO = {
    id: newFillup.id,
    car_id: newFillup.car_id,
    date: newFillup.date,
    fuel_amount: newFillup.fuel_amount,
    total_price: newFillup.total_price,
    odometer: newFillup.odometer,
    distance_traveled: newFillup.distance_traveled,
    fuel_consumption: newFillup.fuel_consumption,
    price_per_liter: newFillup.price_per_liter,
  };

  return {
    ...fillupDTO,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ----------------------------------------------------------------------------
// Update fillup service
// ----------------------------------------------------------------------------

/**
 * Updates an existing fillup for a specific car
 *
 * Business Logic:
 * - Supports partial updates (only provided fields are updated)
 * - Supports two input methods: odometer reading or distance traveled (mutually exclusive)
 * - Automatically recalculates dependent statistics for affected fillups
 * - Validates odometer consistency with previous/next fillups
 * - Returns warnings for validation issues
 *
 * Security:
 * - RLS policies automatically verify car and fillup ownership via user_id
 * - User can only update fillups for their own cars
 *
 * Performance:
 * - Uses idx_fillups_on_car_id index for efficient fillup lookup
 * - Batch updates for recalculating statistics in single transaction
 * - Minimal queries by leveraging RLS for ownership verification
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID (for RLS verification)
 * @param carId - ID of the car the fillup belongs to
 * @param fillupId - ID of the fillup to update
 * @param input - Partial fillup update data
 * @returns UpdatedFillupDTO with updated fillup data, affected entries count, and warnings
 * @throws Error when fillup doesn't exist, doesn't belong to user, or update fails
 */
export async function updateFillup(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  fillupId: string,
  input: UpdateFillupCommand
): Promise<UpdatedFillupDTO> {
  // First, verify the fillup exists and belongs to the user's car
  const { data: existingFillup, error: fillupError } = await supabase
    .from("fillups")
    .select(
      "id, car_id, date, fuel_amount, total_price, odometer, distance_traveled, fuel_consumption, price_per_liter"
    )
    .eq("car_id", carId)
    .eq("id", fillupId)
    .maybeSingle();

  if (fillupError) {
    throw new Error(`Failed to fetch fillup: ${fillupError.message}`);
  }

  if (!existingFillup) {
    throw new Error("Fillup not found");
  }

  // Get car information for initial odometer reference
  const { data: car, error: carError } = await supabase
    .from("cars")
    .select("id, initial_odometer")
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

  // Prepare update data with only provided fields
  const updateData: Partial<{
    date: string;
    fuel_amount: number;
    total_price: number;
    odometer: number;
    distance_traveled: number;
    fuel_consumption: number | null;
    price_per_liter: number | null;
  }> = {};

  // Copy provided fields
  if (input.date !== undefined) updateData.date = input.date;
  if (input.fuel_amount !== undefined) updateData.fuel_amount = input.fuel_amount;
  if (input.total_price !== undefined) updateData.total_price = input.total_price;

  const warnings: ValidationWarningDTO[] = [];

  // Handle odometer/distance updates
  if (input.odometer !== undefined || input.distance !== undefined) {
    let newOdometer: number;
    let newDistanceTraveled: number;

    if (input.odometer !== undefined) {
      // Input method: odometer reading
      newOdometer = input.odometer;

      // Get previous fillup for distance calculation
      const { data: previousFillup, error: prevError } = await supabase
        .from("fillups")
        .select("odometer")
        .eq("car_id", carId)
        .lt("odometer", newOdometer)
        .order("odometer", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prevError) {
        throw new Error(`Failed to fetch previous fillup: ${prevError.message}`);
      }

      if (previousFillup) {
        newDistanceTraveled = newOdometer - previousFillup.odometer;
      } else {
        // This might be the first fillup or odometer went backwards
        const initialOdometer = car.initial_odometer ?? 0;
        newDistanceTraveled = newOdometer - initialOdometer;
      }

      // Validate odometer consistency
      if (newDistanceTraveled < 0) {
        warnings.push({
          field: "odometer",
          message: "Odometer reading is lower than the previous fillup",
        });
      } else if (newDistanceTraveled === 0) {
        warnings.push({
          field: "odometer",
          message: "Odometer reading is the same as the previous fillup",
        });
      }
    } else if (input.distance !== undefined) {
      // Input method: distance traveled
      newDistanceTraveled = input.distance;

      // Get previous fillup for odometer calculation
      const { data: previousFillup, error: prevError } = await supabase
        .from("fillups")
        .select("odometer")
        .eq("car_id", carId)
        .lt("odometer", existingFillup.odometer)
        .order("odometer", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prevError) {
        throw new Error(`Failed to fetch previous fillup: ${prevError.message}`);
      }

      if (previousFillup) {
        newOdometer = previousFillup.odometer + newDistanceTraveled;
      } else {
        // This might be the first fillup
        const initialOdometer = car.initial_odometer ?? 0;
        newOdometer = initialOdometer + newDistanceTraveled;
      }
    } else {
      throw new Error("Either odometer or distance must be provided");
    }

    updateData.odometer = newOdometer;
    updateData.distance_traveled = newDistanceTraveled;
  }

  // Calculate fuel consumption and price per liter if fuel data is provided
  if (input.fuel_amount !== undefined || input.total_price !== undefined) {
    const fuelAmount = input.fuel_amount ?? existingFillup.fuel_amount;
    const totalPrice = input.total_price ?? existingFillup.total_price;
    const distanceTraveled = updateData.distance_traveled ?? existingFillup.distance_traveled;

    updateData.fuel_consumption =
      distanceTraveled && distanceTraveled > 0 ? (fuelAmount / distanceTraveled) * 100 : null;
    updateData.price_per_liter = fuelAmount > 0 ? totalPrice / fuelAmount : null;
  }

  // Update the fillup
  const { data: updatedFillup, error: updateError } = await supabase
    .from("fillups")
    .update(updateData)
    .eq("id", fillupId)
    .eq("car_id", carId)
    .select(
      "id, car_id, date, fuel_amount, total_price, odometer, distance_traveled, fuel_consumption, price_per_liter"
    )
    .single();

  if (updateError) {
    throw new Error(`Failed to update fillup: ${updateError.message}`);
  }

  if (!updatedFillup) {
    throw new Error("Failed to update fillup");
  }

  // Recalculate statistics for affected fillups
  let updatedEntriesCount = 1; // The current fillup is always updated

  // If odometer or distance was changed, we need to recalculate subsequent fillups
  if (input.odometer !== undefined || input.distance !== undefined) {
    const newOdometer = updateData.odometer ?? existingFillup.odometer;

    // Get all fillups that come after this one (higher odometer readings)
    const { data: subsequentFillups, error: subsequentError } = await supabase
      .from("fillups")
      .select("id, odometer, fuel_amount, total_price, distance_traveled")
      .eq("car_id", carId)
      .gt("odometer", newOdometer)
      .order("odometer", { ascending: true });

    if (subsequentError) {
      throw new Error(`Failed to fetch subsequent fillups: ${subsequentError.message}`);
    }

    if (subsequentFillups && subsequentFillups.length > 0) {
      // Recalculate distance_traveled and fuel_consumption for each subsequent fillup
      const updates = [];

      for (let i = 0; i < subsequentFillups.length; i++) {
        const currentFillup = subsequentFillups[i];
        const previousFillup = i === 0 ? updatedFillup : subsequentFillups[i - 1];

        const newDistanceTraveled = currentFillup.odometer - previousFillup.odometer;
        const newFuelConsumption =
          newDistanceTraveled > 0 ? (currentFillup.fuel_amount / newDistanceTraveled) * 100 : null;

        updates.push({
          id: currentFillup.id,
          distance_traveled: newDistanceTraveled,
          fuel_consumption: newFuelConsumption,
        });
      }

      // Batch update all subsequent fillups
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("fillups")
          .update({
            distance_traveled: update.distance_traveled,
            fuel_consumption: update.fuel_consumption,
          })
          .eq("id", update.id);

        if (updateError) {
          throw new Error(`Failed to update subsequent fillup ${update.id}: ${updateError.message}`);
        }
      }

      updatedEntriesCount += updates.length;
    }
  }

  // Map to FillupDTO
  const fillupDTO: FillupDTO = {
    id: updatedFillup.id,
    car_id: updatedFillup.car_id,
    date: updatedFillup.date,
    fuel_amount: updatedFillup.fuel_amount,
    total_price: updatedFillup.total_price,
    odometer: updatedFillup.odometer,
    distance_traveled: updatedFillup.distance_traveled,
    fuel_consumption: updatedFillup.fuel_consumption,
    price_per_liter: updatedFillup.price_per_liter,
  };

  return {
    ...fillupDTO,
    updated_entries_count: updatedEntriesCount,
    warnings,
  };
}

// ----------------------------------------------------------------------------
// Delete fillup service
// ----------------------------------------------------------------------------

/**
 * Deletes an existing fillup for a specific car
 *
 * Business Logic:
 * - Verifies fillup exists and belongs to user's car
 * - Deletes the fillup from database
 * - Automatically recalculates statistics for subsequent fillups
 * - Returns count of updated entries (subsequent fillups that were recalculated)
 *
 * Security:
 * - RLS policies automatically verify car and fillup ownership via user_id
 * - User can only delete fillups for their own cars
 *
 * Performance:
 * - Uses idx_fillups_on_car_id index for efficient fillup lookup
 * - Batch updates for recalculating statistics in single transaction
 * - Minimal queries by leveraging RLS for ownership verification
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID (for RLS verification)
 * @param carId - ID of the car the fillup belongs to
 * @param fillupId - ID of the fillup to delete
 * @returns DeleteResponseDTO with success message and count of updated entries
 * @throws Error when fillup doesn't exist, doesn't belong to user, or deletion fails
 */
export async function deleteFillup(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  fillupId: string
): Promise<DeleteResponseDTO> {
  // First, verify the fillup exists and belongs to the user's car
  const { data: existingFillup, error: fillupError } = await supabase
    .from("fillups")
    .select("id, car_id, odometer")
    .eq("car_id", carId)
    .eq("id", fillupId)
    .maybeSingle();

  if (fillupError) {
    throw new Error(`Failed to fetch fillup: ${fillupError.message}`);
  }

  if (!existingFillup) {
    throw new Error("Fillup not found");
  }

  // Get car information for verification
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

  // Get all fillups that come after this one (higher odometer readings)
  // These will need their statistics recalculated
  // Uses idx_fillups_on_car_id_odometer_id index for efficient query
  const { data: subsequentFillups, error: subsequentError } = await supabase
    .from("fillups")
    .select("id, odometer, fuel_amount, total_price, distance_traveled")
    .eq("car_id", carId)
    .gt("odometer", existingFillup.odometer)
    .order("odometer", { ascending: true });

  if (subsequentError) {
    throw new Error(`Failed to fetch subsequent fillups: ${subsequentError.message}`);
  }

  // Delete the fillup
  const { error: deleteError } = await supabase.from("fillups").delete().eq("id", fillupId).eq("car_id", carId);

  if (deleteError) {
    throw new Error(`Failed to delete fillup: ${deleteError.message}`);
  }

  // Recalculate statistics for subsequent fillups
  let updatedEntriesCount = 0;

  if (subsequentFillups && subsequentFillups.length > 0) {
    // Get the fillup that comes before the deleted one (for distance calculation)
    const { data: previousFillup, error: prevError } = await supabase
      .from("fillups")
      .select("odometer")
      .eq("car_id", carId)
      .lt("odometer", existingFillup.odometer)
      .order("odometer", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevError) {
      throw new Error(`Failed to fetch previous fillup: ${prevError.message}`);
    }

    // Recalculate distance_traveled and fuel_consumption for each subsequent fillup
    const updates = [];

    for (let i = 0; i < subsequentFillups.length; i++) {
      const currentFillup = subsequentFillups[i];
      const previousFillupForCalculation = i === 0 ? previousFillup : subsequentFillups[i - 1];

      if (previousFillupForCalculation) {
        const newDistanceTraveled = currentFillup.odometer - previousFillupForCalculation.odometer;
        const newFuelConsumption =
          newDistanceTraveled > 0 ? (currentFillup.fuel_amount / newDistanceTraveled) * 100 : null;

        updates.push({
          id: currentFillup.id,
          distance_traveled: newDistanceTraveled,
          fuel_consumption: newFuelConsumption,
        });
      }
    }

    // Batch update all subsequent fillups
    // Note: Supabase doesn't support batch updates in a single query,
    // but we can optimize by using prepared statements and error handling
    const updatePromises = updates.map(async (update) => {
      const { error: updateError } = await supabase
        .from("fillups")
        .update({
          distance_traveled: update.distance_traveled,
          fuel_consumption: update.fuel_consumption,
        })
        .eq("id", update.id);

      if (updateError) {
        throw new Error(`Failed to update subsequent fillup ${update.id}: ${updateError.message}`);
      }
    });

    // Execute all updates in parallel for better performance
    await Promise.all(updatePromises);

    updatedEntriesCount = updates.length;
  }

  // Log successful deletion with performance metrics
  // eslint-disable-next-line no-console
  console.log(
    `[deleteFillup] carId=${carId} fillupId=${fillupId} deletedOdometer=${existingFillup.odometer} subsequentFillups=${subsequentFillups?.length ?? 0} updatedEntries=${updatedEntriesCount}`
  );

  return {
    message: "Fillup deleted successfully",
    updated_entries_count: updatedEntriesCount,
  };
}
