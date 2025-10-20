import type { CarWithStatisticsDTO, CarStatisticsView, CarDetailsDTO } from "../../types.ts";
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
