# Database Schema for JustFuel

## 1. Tables

### Table: `cars`

Stores information about user's cars.

| Column                    | Data Type     | Constraints                                                               | Description                               |
| ------------------------- | ------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| `id`                      | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                | Unique identifier for the car.            |
| `user_id`                 | `uuid`        | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                 | Foreign key linking to the user.          |
| `name`                    | `text`        | `NOT NULL`                                                                | Name of the car (e.g., "My Audi A4").     |
| `initial_odometer`        | `numeric`     | `NULL`                                                                    | Optional initial odometer reading.        |
| `mileage_input_preference`| `text`        | `NOT NULL`, `DEFAULT 'odometer'`, `CHECK (value IN ('odometer', 'distance'))` | User's preferred mileage input method.    |
| `created_at`              | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                               | Timestamp of when the car was created.    |
|                           |               | `UNIQUE (user_id, name)`                                                  | Ensures car names are unique per user.    |

### Table: `fillups`

Stores the history of fuel fill-ups for each car.

| Column             | Data Type     | Constraints                                                | Description                                    |
| ------------------ | ------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `id`               | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                 | Unique identifier for the fill-up entry.       |
| `car_id`           | `uuid`        | `NOT NULL`, `REFERENCES cars(id) ON DELETE CASCADE`        | Foreign key linking to the car.                |
| `date`             | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                | Date and time of the fill-up.                  |
| `fuel_amount`      | `numeric`     | `NOT NULL`                                                 | Amount of fuel added (in liters).              |
| `total_price`      | `numeric`     | `NOT NULL`                                                 | Total price paid for the fuel.                 |
| `odometer`         | `numeric`     | `NOT NULL`                                                 | Odometer reading at the time of fill-up.       |
| `distance_traveled`| `numeric`     | `NULL`                                                     | (Denormalized) Distance since last fill-up.    |
| `fuel_consumption` | `numeric`     | `NULL`                                                     | (Denormalized) Calculated fuel consumption.    |
| `price_per_liter`  | `numeric`     | `NULL`                                                     | (Denormalized) Calculated price per liter.     |
| `created_at`       | `timestamptz` | `NOT NULL`, `DEFAULT now()`                                | Timestamp of when the entry was created.       |

### View: `car_statistics`

A virtual table for aggregating key statistics for each car to simplify frontend queries.

| Column                 | Data Type | Description                                        |
| ---------------------- | --------- | -------------------------------------------------- |
| `car_id`               | `uuid`    | The ID of the car.                                 |
| `total_fuel_cost`      | `numeric` | Sum of `total_price` for all fill-ups.             |
| `total_fuel_amount`    | `numeric` | Sum of `fuel_amount` for all fill-ups.             |
| `total_distance`       | `numeric` | Sum of `distance_traveled` for all fill-ups.       |
| `average_consumption`  | `numeric` | Average fuel consumption across all fill-ups.      |
| `average_price_per_liter` | `numeric` | Average price per liter across all fill-ups.       |
| `fillup_count`         | `bigint`  | Total number of fill-up entries.                   |

```sql
CREATE OR REPLACE VIEW public.car_statistics AS
SELECT
    c.id AS car_id,
    sum(f.total_price) AS total_fuel_cost,
    sum(f.fuel_amount) AS total_fuel_amount,
    sum(f.distance_traveled) AS total_distance,
    avg(f.fuel_consumption) AS average_consumption,
    avg(f.price_per_liter) AS average_price_per_liter,
    count(f.id) AS fillup_count
FROM
    cars c
JOIN
    fillups f ON c.id = f.car_id
GROUP BY
    c.id;
```

## 2. Relationships

-   **`auth.users` to `cars`**: One-to-Many. One user can have multiple cars. A car belongs to exactly one user.
    -   Implemented via `cars.user_id` foreign key referencing `auth.users.id`.
-   **`cars` to `fillups`**: One-to-Many. One car can have multiple fill-up entries. A fill-up entry belongs to exactly one car.
    -   Implemented via `fillups.car_id` foreign key referencing `cars.id`.

## 3. Indexes

To optimize query performance, the following indexes should be created:

-   `idx_cars_on_user_id`: On the `cars(user_id)` column to quickly fetch all cars for a specific user.
-   `idx_fillups_on_car_id`: On the `fillups(car_id)` column to quickly fetch all fill-ups for a specific car.
-   `idx_fillups_on_date`: On the `fillups(date)` column to efficiently sort fill-ups by date.

```sql
-- Index for cars table
CREATE INDEX idx_cars_on_user_id ON public.cars (user_id);

-- Indexes for fillups table
CREATE INDEX idx_fillups_on_car_id ON public.fillups (car_id);
CREATE INDEX idx_fillups_on_date ON public.fillups (date DESC);
```

## 4. Row-Level Security (RLS) Policies

RLS is enabled to ensure that users can only access their own data.

### RLS for `cars` table

```sql
-- 1. Enable RLS
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for SELECT
CREATE POLICY "Users can view their own cars"
ON public.cars FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create policy for INSERT
CREATE POLICY "Users can create new cars for themselves"
ON public.cars FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Create policy for UPDATE
CREATE POLICY "Users can update their own cars"
ON public.cars FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Create policy for DELETE
CREATE POLICY "Users can delete their own cars"
ON public.cars FOR DELETE
USING (auth.uid() = user_id);
```

### RLS for `fillups` table

```sql
-- 1. Enable RLS
ALTER TABLE public.fillups ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for SELECT
CREATE POLICY "Users can view fill-ups for their own cars"
ON public.fillups FOR SELECT
USING (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

-- 3. Create policy for INSERT
CREATE POLICY "Users can add fill-ups for their own cars"
ON public.fillups FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

-- 4. Create policy for UPDATE
CREATE POLICY "Users can update fill-ups for their own cars"
ON public.fillups FOR UPDATE
USING (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));

-- 5. Create policy for DELETE
CREATE POLICY "Users can delete fill-ups for their own cars"
ON public.fillups FOR DELETE
USING (auth.uid() = (SELECT user_id FROM cars WHERE id = car_id));
```

## 5. Design Notes

-   **UUIDs as Primary Keys**: Using `uuid` for primary keys (`gen_random_uuid()`) avoids exposing sequential information and is a best practice for distributed systems.
-   **Denormalization for Performance**: The `fillups` table includes denormalized columns (`distance_traveled`, `fuel_consumption`, `price_per_liter`). This is a deliberate choice to optimize for read performance, which will be the most common operation. The application logic is responsible for calculating and populating these fields upon data entry or modification.
-   **Cascading Deletes**: `ON DELETE CASCADE` is used to maintain referential integrity. Deleting a user will delete their cars, and deleting a car will delete its associated fill-ups.
-   **Business Logic in Application Layer**: All calculations and business-specific validations (e.g., "soft" validation for odometer readings) are handled in the application layer (Astro API routes), not in the database via triggers or stored procedures. This keeps the database schema clean and separates concerns.
-   **Time Zones**: Using `timestamptz` for all date/time columns is crucial for handling time zones correctly, ensuring data consistency regardless of the user's or server's location.

