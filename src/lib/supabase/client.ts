import { createClient } from "@supabase/supabase-js";

// Safe to use from the browser — the anon key is public by design, and the
// only thing it's allowed to do is read template_entries (see the RLS
// policy: public select, no insert/update/delete for this role). Writes go
// through the service-role client in library-actions.ts instead.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
