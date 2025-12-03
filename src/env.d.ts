/// <reference types="astro/client" />

import type { AppSupabaseClient } from './db/supabase.client.ts';

declare global {
  namespace App {
    interface Locals {
      supabase: AppSupabaseClient;
      user?: {
        id: string;
        email?: string;
      };
      isAuthenticated?: boolean;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
