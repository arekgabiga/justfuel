/**
 * migration: add_fillups_indexes
 *
 * purpose:
 * this migration adds composite indexes to optimize fillups queries,
 * especially for the GET /api/cars/{carId}/fillups endpoint with pagination.
 *
 * affected tables:
 * - public.fillups
 */

-- create composite index for sorting fillups by date for a specific car
-- this index will be used for: WHERE car_id = ? ORDER BY date DESC, id ASC
create index idx_fillups_on_car_id_date_id on public.fillups (car_id, date desc, id asc);

-- create composite index for sorting fillups by odometer for a specific car
-- this index will be used for: WHERE car_id = ? ORDER BY odometer DESC, id ASC
create index idx_fillups_on_car_id_odometer_id on public.fillups (car_id, odometer desc, id asc);

comment on index idx_fillups_on_car_id_date_id is 'composite index for efficient date-based pagination of fillups per car';
comment on index idx_fillups_on_car_id_odometer_id is 'composite index for efficient odometer-based pagination of fillups per car';

-- drop the old single-column index on date as it's now redundant
-- the composite indexes will be used instead
drop index if exists idx_fillups_on_date;

