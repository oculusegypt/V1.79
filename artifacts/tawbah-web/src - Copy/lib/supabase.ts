import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined)
  ?? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is required");
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or VITE_SUPABASE_ANON_KEY) is required");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
