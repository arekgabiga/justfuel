/// <reference types="astro/client" />

import type { AppSupabaseClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: AppSupabaseClient;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly DEV_AUTH_FALLBACK?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
