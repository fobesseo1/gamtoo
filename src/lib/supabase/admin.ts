import "server-only";
import { createClient } from "@supabase/supabase-js";

// Bypasses RLS entirely — never import this outside server-only code
// (Server Actions, Route Handlers). Used for the admin template writes in
// library-actions.ts, which are only reachable through pages already gated
// behind the /admin/* password check in proxy.ts.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
