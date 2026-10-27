function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local.`);
  return value;
}

/** Project origin only. People paste the REST endpoint by mistake, so any path is dropped. */
export const SUPABASE_URL      = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/(\.supabase\.co)\/.*$/, "$1");
export const SUPABASE_ANON_KEY = required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
