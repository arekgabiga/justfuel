import type {
  CarWithStatisticsDTO,
  CarStatisticsView,
  CarDetailsDTO,
  CreateCarCommand,
  UpdateCarCommand,
  DeleteCarCommand,
  DeleteResponseDTO,
} from "../../types.ts";
import type { AppSupabaseClient } from "../../db/supabase.client.ts";

export interface ListCarsParams {
  sort?: "name" | "created_at";
  order?: "asc" | "desc";
}

const SORT_COLUMN_WHITELIST: Record<NonNullable<ListCarsParams["sort"]>, string> = {
  name: "name",
  created_at: "created_at",
};

const ORDER_WHITELIST: Record<NonNullable<ListCarsParams["order"]>, { ascending: boolean }> = {
  asc: { ascending: true },
  desc: { ascending: false },
};

export async function listUserCarsWithStats(
  supabase: AppSupabaseClient,
  params: ListCarsParams,
  options?: { userId?: string }
): Promise<CarWithStatisticsDTO[]> {
  const sort = params.sort ?? "created_at";
  const order = params.order ?? "desc";

  const sortColumn = SORT_COLUMN_WHITELIST[sort];
  const orderCfg = ORDER_WHITELIST[order];

  let carsQuery = supabase
    .from("cars")
    .select("id, name, initial_odometer, mileage_input_preference")
    .order(sortColumn, orderCfg);

  if (options?.userId) {
    carsQuery = carsQuery.eq("user_id", options.userId);
  }

  const { data: cars, error: carsError } = await carsQuery;
  if (carsError) {
    throw new Error(`Failed to fetch cars: ${carsError.message}`);
  }

  if (!cars || cars.length === 0) {
    return [];
  }

  const carIds = cars.map((c) => c.id);

  const { data: statsRows, error: statsError } = await supabase
    .from("car_statistics")
    .select(
      "car_id,total_fuel_cost,total_fuel_amount,total_distance,average_consumption,average_price_per_liter,fillup_count"
    )
    .in("car_id", carIds);

  if (statsError) {
    throw new Error(`Failed to fetch car statistics: ${statsError.message}`);
  }

  const carIdToStats = new Map<
    string,
    Pick<
      CarStatisticsView,
      | "total_fuel_cost"
      | "total_fuel_amount"
      | "total_distance"
      | "average_consumption"
      | "average_price_per_liter"
      | "fillup_count"
    >
  >();

  if (statsRows) {
    for (const row of statsRows) {
      if (!row.car_id) continue;
      carIdToStats.set(row.car_id, {
        total_fuel_cost: row.total_fuel_cost ?? null,
        total_fuel_amount: row.total_fuel_amount ?? null,
        total_distance: row.total_distance ?? null,
        average_consumption: row.average_consumption ?? null,
        average_price_per_liter: row.average_price_per_liter ?? null,
        fillup_count: row.fillup_count ?? null,
      });
    }
  }

  return cars.map((c) => {
    const s = carIdToStats.get(c.id);
    return {
      id: c.id,
      name: c.name,
      initial_odometer: c.initial_odometer,
      mileage_input_preference: c.mileage_input_preference,
      statistics: {
        total_fuel_cost: s?.total_fuel_cost ?? 0,
        total_fuel_amount: s?.total_fuel_amount ?? 0,
        total_distance: s?.total_distance ?? 0,
        average_consumption: s?.average_consumption ?? 0,
        average_price_per_liter: s?.average_price_per_liter ?? 0,
        fillup_count: s?.fillup_count ?? 0,
      },
    };
  });
}

export async function getUserCarWithStats(
  supabase: AppSupabaseClient,
  carId: string,
  options?: { userId?: string }
): Promise<CarDetailsDTO | null> {
  let carQuery = supabase
    .from("cars")
    .select("id, name, initial_odometer, mileage_input_preference, created_at, user_id")
    .eq("id", carId);

  if (options?.userId) {
    carQuery = carQuery.eq("user_id", options.userId);
  }

  const { data: car, error: carError } = await carQuery.limit(1).maybeSingle();
  if (carError) {
    // Return null on not found; throw on other errors
    if (carError.code === "PGRST116" /* No rows returned */ || carError.details?.includes("Results contain 0 rows")) {
      return null;
    }
    return null;
  }

  if (!car) {
    return null;
  }

  const { data: statsRow, error: statsError } = await supabase
    .from("car_statistics")
    .select(
      "car_id,total_fuel_cost,total_fuel_amount,total_distance,average_consumption,average_price_per_liter,fillup_count"
    )
    .eq("car_id", car.id)
    .limit(1)
    .maybeSingle();

  if (statsError) {
    // If stats view fails, still return car with zeroed statistics instead of failing the whole request
    // Intentionally swallow the error to provide a resilient response
  }

  const result: CarDetailsDTO = {
    id: car.id,
    name: car.name,
    initial_odometer: car.initial_odometer,
    mileage_input_preference: car.mileage_input_preference,
    created_at: car.created_at,
    statistics: {
      total_fuel_cost: statsRow?.total_fuel_cost ?? 0,
      total_fuel_amount: statsRow?.total_fuel_amount ?? 0,
      total_distance: statsRow?.total_distance ?? 0,
      average_consumption: statsRow?.average_consumption ?? 0,
      average_price_per_liter: statsRow?.average_price_per_liter ?? 0,
      fillup_count: statsRow?.fillup_count ?? 0,
    },
  };

  return result;
}

// ----------------------------------------------------------------------------
// Create car service
// ----------------------------------------------------------------------------

/**
 * Custom error thrown when car name already exists for the user
 * Maps to HTTP 409 Conflict status
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Creates a new car for the authenticated user
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param input - Car creation data (name, initial_odometer, mileage_input_preference)
 * @returns CarDetailsDTO with zeroed statistics for the new car
 * @throws ConflictError when car name already exists for the user
 */
export async function createCar(
  supabase: AppSupabaseClient,
  userId: string,
  input: CreateCarCommand
): Promise<CarDetailsDTO> {
  // Insert new car with user_id to ensure RLS compliance
  const { data, error } = await supabase
    .from("cars")
    .insert({ user_id: userId, ...input })
    .select("id, name, initial_odometer, mileage_input_preference, created_at")
    .single();

  if (error) {
    // Handle unique constraint violation (car name already exists for user)
    interface SupabaseErrorLike {
      code?: string;
      message: string;
    }
    const supaErr = error as SupabaseErrorLike;
    if (supaErr.code === "23505" || /duplicate key/i.test(supaErr.message)) {
      throw new ConflictError("Car name already exists");
    }
    throw error;
  }

  if (!data) {
    throw new Error("Failed to insert car");
  }

  // Return car details with zeroed statistics (no fillups yet)
  return {
    id: data.id,
    name: data.name,
    initial_odometer: data.initial_odometer,
    mileage_input_preference: data.mileage_input_preference,
    created_at: data.created_at,
    statistics: {
      total_fuel_cost: 0,
      total_fuel_amount: 0,
      total_distance: 0,
      average_consumption: 0,
      average_price_per_liter: 0,
      fillup_count: 0,
    },
  };
}

// ----------------------------------------------------------------------------
// Update car service
// ----------------------------------------------------------------------------

/**
 * Updates an existing car for the authenticated user
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param carId - ID of the car to update
 * @param input - Car update data (name, mileage_input_preference)
 * @returns CarDetailsDTO with updated data and current statistics
 * @throws ConflictError when car name already exists for the user
 */
export async function updateCar(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  input: UpdateCarCommand
): Promise<CarDetailsDTO> {
  // First, verify the car exists and belongs to the user
  const { data: existingCar, error: fetchError } = await supabase
    .from("cars")
    .select("id, name, user_id")
    .eq("id", carId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch car: ${fetchError.message}`);
  }

  if (!existingCar) {
    throw new Error("Car not found or does not belong to user");
  }

  // Check for name uniqueness if name is being updated
  if (input.name && input.name !== existingCar.name) {
    const { data: duplicateCar, error: duplicateError } = await supabase
      .from("cars")
      .select("id")
      .eq("user_id", userId)
      .eq("name", input.name)
      .neq("id", carId)
      .limit(1)
      .maybeSingle();

    if (duplicateError) {
      throw new Error(`Failed to check name uniqueness: ${duplicateError.message}`);
    }

    if (duplicateCar) {
      throw new ConflictError("Car name already exists");
    }
  }

  // Update the car
  const { data, error } = await supabase
    .from("cars")
    .update(input)
    .eq("id", carId)
    .eq("user_id", userId)
    .select("id, name, initial_odometer, mileage_input_preference, created_at")
    .single();

  if (error) {
    // Handle unique constraint violation (car name already exists for user)
    interface SupabaseErrorLike {
      code?: string;
      message: string;
    }
    const supaErr = error as SupabaseErrorLike;
    if (supaErr.code === "23505" || /duplicate key/i.test(supaErr.message)) {
      throw new ConflictError("Car name already exists");
    }
    throw new Error(`Failed to update car: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to update car");
  }

  // Fetch current statistics for the updated car
  const { data: statsRow, error: statsError } = await supabase
    .from("car_statistics")
    .select(
      "car_id,total_fuel_cost,total_fuel_amount,total_distance,average_consumption,average_price_per_liter,fillup_count"
    )
    .eq("car_id", data.id)
    .limit(1)
    .maybeSingle();

  if (statsError) {
    // If stats view fails, still return car with zeroed statistics instead of failing the whole request
    // Intentionally swallow the error to provide a resilient response
  }

  // Return updated car details with current statistics
  return {
    id: data.id,
    name: data.name,
    initial_odometer: data.initial_odometer,
    mileage_input_preference: data.mileage_input_preference,
    created_at: data.created_at,
    statistics: {
      total_fuel_cost: statsRow?.total_fuel_cost ?? 0,
      total_fuel_amount: statsRow?.total_fuel_amount ?? 0,
      total_distance: statsRow?.total_distance ?? 0,
      average_consumption: statsRow?.average_consumption ?? 0,
      average_price_per_liter: statsRow?.average_price_per_liter ?? 0,
      fillup_count: statsRow?.fillup_count ?? 0,
    },
  };
}

// ----------------------------------------------------------------------------
// Delete car service
// ----------------------------------------------------------------------------

/**
 * Deletes a car and all associated fillups for the authenticated user
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param carId - ID of the car to delete
 * @param input - Delete confirmation data (confirmation_name)
 * @returns DeleteResponseDTO with success message
 * @throws Error when car not found, confirmation name mismatch, or deletion fails
 */
export async function deleteCar(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  input: DeleteCarCommand
): Promise<DeleteResponseDTO> {
  // First, verify the car exists and belongs to the user
  const { data: existingCar, error: fetchError } = await supabase
    .from("cars")
    .select("id, name, user_id")
    .eq("id", carId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch car: ${fetchError.message}`);
  }

  if (!existingCar) {
    throw new Error("Car not found");
  }

  // Verify confirmation name matches the actual car name
  if (input.confirmation_name !== existingCar.name) {
    throw new Error("Confirmation name does not match car name");
  }

  // Delete the car (cascade delete will handle fillups automatically)
  const { error: deleteError } = await supabase.from("cars").delete().eq("id", carId).eq("user_id", userId);

  if (deleteError) {
    throw new Error(`Failed to delete car: ${deleteError.message}`);
  }

  return {
    message: "Car and all associated fillups deleted successfully",
  };
}
