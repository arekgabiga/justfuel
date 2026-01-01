/**
 * Migration: enable_rls
 *
 * Purpose:
 * This migration enables Row Level Security (RLS) on the cars and fillups tables.
 * RLS was incorrectly disabled in the initial schema migration, creating a critical
 * security vulnerability where users could potentially access other users' data.
 *
 * Background:
 * The initial migration (20251013110121_initial_schema.sql) defined RLS policies
 * but explicitly disabled RLS on lines 85 and 134. This migration fixes that issue.
 *
 * Affected tables:
 * - public.cars
 * - public.fillups
 */

-- Enable Row Level Security on the cars table
-- This ensures that the defined RLS policies are enforced
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on the fillups table
-- This ensures that the defined RLS policies are enforced
ALTER TABLE public.fillups ENABLE ROW LEVEL SECURITY;
