import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const DEFAULT_USER_ID = "5cd0bbbb-cf97-45e1-959b-ee2f63af69a7";

// Expose the app-level Supabase client type without importing from @supabase/supabase-js
export type AppSupabaseClient = typeof supabaseClient;
