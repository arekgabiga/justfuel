/**
 * migration: initial_schema
 *
 * purpose:
 * this migration sets up the initial database schema for justfuel,
 * including tables for cars and fill-ups, a view for car statistics,
 * necessary indexes, and row-level security policies to ensure data privacy.
 *
 * affected tables:
 * - public.cars
 * - public.fillups
 *
 * affected views:
 * - public.car_statistics
 */

-- step 1: create the 'cars' table
-- this table stores information about a user's car.
create table public.cars (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    initial_odometer numeric null,
    mileage_input_preference text not null default 'odometer' check (mileage_input_preference in ('odometer', 'distance')),
    created_at timestamptz not null default now(),
    unique (user_id, name)
);

comment on table public.cars is 'stores information about user''s cars.';

-- step 2: create the 'fillups' table
-- this table stores the history of fuel fill-ups for each car.
create table public.fillups (
    id uuid primary key default gen_random_uuid(),
    car_id uuid not null references public.cars(id) on delete cascade,
    date timestamptz not null default now(),
    fuel_amount numeric not null,
    total_price numeric not null,
    odometer numeric not null,
    distance_traveled numeric null,
    fuel_consumption numeric null,
    price_per_liter numeric null,
    created_at timestamptz not null default now()
);

comment on table public.fillups is 'stores the history of fuel fill-ups for each car.';

-- step 3: create the 'car_statistics' view
-- this view provides aggregated statistics for each car to simplify frontend queries.
create or replace view public.car_statistics as
select
    c.id as car_id,
    sum(f.total_price) as total_fuel_cost,
    sum(f.fuel_amount) as total_fuel_amount,
    sum(f.distance_traveled) as total_distance,
    avg(f.fuel_consumption) as average_consumption,
    avg(f.price_per_liter) as average_price_per_liter,
    count(f.id) as fillup_count
from
    public.cars c
join
    public.fillups f on c.id = f.car_id
group by
    c.id;

comment on view public.car_statistics is 'a virtual table for aggregating key statistics for each car.';

-- step 4: create indexes for performance
-- these indexes will speed up common query operations.

-- index on cars(user_id) to quickly fetch all cars for a specific user.
create index idx_cars_on_user_id on public.cars (user_id);

-- index on fillups(car_id) to quickly fetch all fill-ups for a specific car.
create index idx_fillups_on_car_id on public.fillups (car_id);

-- index on fillups(date) to efficiently sort fill-ups by date.
create index idx_fillups_on_date on public.fillups (date desc);


-- step 5: enable row-level security (rls) and define policies for 'cars'
-- rls ensures that users can only access and modify their own data.

-- enable rls on the 'cars' table.
alter table public.cars disable row level security;

-- policies for authenticated users
create policy "authenticated users can view their own cars"
on public.cars for select
to authenticated
using (auth.uid() = user_id);

create policy "authenticated users can create cars for themselves"
on public.cars for insert
to authenticated
with check (auth.uid() = user_id);

create policy "authenticated users can update their own cars"
on public.cars for update
to authenticated
using (auth.uid() = user_id);

create policy "authenticated users can delete their own cars"
on public.cars for delete
to authenticated
using (auth.uid() = user_id);

-- policies for anonymous users (restrictive)
create policy "anonymous users cannot view cars"
on public.cars for select
to anon
using (false);

create policy "anonymous users cannot create cars"
on public.cars for insert
to anon
with check (false);

create policy "anonymous users cannot update cars"
on public.cars for update
to anon
using (false);

create policy "anonymous users cannot delete cars"
on public.cars for delete
to anon
using (false);


-- step 6: enable row-level security (rls) and define policies for 'fillups'
-- rls for fillups is based on car ownership.

-- enable rls on the 'fillups' table.
alter table public.fillups disable row level security;

-- policies for authenticated users
create policy "authenticated users can view fill-ups for their own cars"
on public.fillups for select
to authenticated
using (auth.uid() = (select user_id from public.cars where id = car_id));

create policy "authenticated users can add fill-ups for their own cars"
on public.fillups for insert
to authenticated
with check (auth.uid() = (select user_id from public.cars where id = car_id));

create policy "authenticated users can update fill-ups for their own cars"
on public.fillups for update
to authenticated
using (auth.uid() = (select user_id from public.cars where id = car_id));

create policy "authenticated users can delete fill-ups for their own cars"
on public.fillups for delete
to authenticated
using (auth.uid() = (select user_id from public.cars where id = car_id));

-- policies for anonymous users (restrictive)
create policy "anonymous users cannot view fill-ups"
on public.fillups for select
to anon
using (false);

create policy "anonymous users cannot add fill-ups"
on public.fillups for insert
to anon
with check (false);

create policy "anonymous users cannot update fill-ups"
on public.fillups for update
to anon
using (false);

create policy "anonymous users cannot delete fill-ups"
on public.fillups for delete
to anon
using (false);
