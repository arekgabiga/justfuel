-- migration: make_odometer_nullable
-- purpose: allow nullable odometer for distance-based fillup entries
-- affected tables: fillups
-- affected columns: odometer
-- special considerations: this change allows the odometer column to store null values, which is required for the new 'strict distance' input mode where odometer readings are not collected.

-- alter the fillups table to allow null values in the odometer column
-- this is a non-destructive change that relaxes a constraint
alter table fillups alter column odometer drop not null;
