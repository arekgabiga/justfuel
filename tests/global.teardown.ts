import { test as teardown } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/db/database.types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const userId = process.env.E2E_USERNAME_ID;
const email = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

teardown('delete database', async () => {
  console.log('Cleaning up database for user:', userId);

  if (!supabaseUrl || !supabaseKey || !userId || !email || !password) {
    console.error('Missing environment variables for database cleanup.');
    return;
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // Authenticate to access user's data (RLS)
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Error signing in for cleanup:', authError);
    return;
  }

  // 1. Get cars for user
  const { data: cars, error: carsFetchError } = await supabase.from('cars').select('id').eq('user_id', userId);

  if (carsFetchError) {
    console.error('Error fetching cars:', carsFetchError);
    return;
  }

  if (!cars || cars.length === 0) {
    console.log('No cars found to clean up.');
    return;
  }

  const carIds = cars.map((c) => c.id);

  console.log(`Found ${carIds.length} cars to delete.`);

  // 2. Delete fillups for these cars
  const { error: fillupsError } = await supabase.from('fillups').delete().in('car_id', carIds);

  if (fillupsError) {
    console.error('Error deleting fillups:', fillupsError);
  } else {
    console.log('Fillups deleted successfully.');
  }

  // 3. Delete cars
  const { error: carsError } = await supabase.from('cars').delete().in('id', carIds);

  if (carsError) {
    console.error('Error deleting cars:', carsError);
  } else {
    console.log('Cars deleted successfully.');
  }

  console.log('Database cleanup complete.');
});
