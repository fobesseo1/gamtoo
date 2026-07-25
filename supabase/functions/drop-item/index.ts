// Drop-judgment Edge Function (docs/gamtoo-item-system.md 5).
//
// Runs server-side on purpose, even though Phase 1 only needs a guaranteed
// (non-probabilistic) drop -- the probability roll gets added inside this
// same function later; nothing about the client/server boundary changes
// when it does. The caller's identity always comes from their JWT
// (auth.getUser() below), never from a client-supplied user id -- a
// client could otherwise farm items for someone else's account.
import { createClient } from "jsr:@supabase/supabase-js@2";

const PHASE_1_ITEM_ID = "hat_crown";
const UNIQUE_VIOLATION = "23505";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method-not-allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "missing-authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verifies the JWT's signature/expiry and resolves the real caller.
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData.user) return jsonResponse({ error: "not-authenticated" }, 401);
    const userId = userData.user.id;

    let postId: unknown;
    try {
      ({ postId } = await req.json());
    } catch {
      return jsonResponse({ error: "invalid-body" }, 400);
    }
    if (typeof postId !== "string") return jsonResponse({ error: "missing-post-id" }, 400);

    // Bypasses RLS for the privileged reads/writes below -- this key never
    // leaves the function (not returned in any response).
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: post, error: postError } = await admin
      .from("posts")
      .select("user_id, has_photo")
      .eq("id", postId)
      .maybeSingle();
    if (postError) throw postError;
    // Also rejects a postId that belongs to someone else's post -- a
    // client can't use another user's photo to farm a drop.
    if (!post || post.user_id !== userId) return jsonResponse({ error: "post-not-found" }, 404);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("amaze_count, last_drop_date")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw profileError;

    const today = todayUtc();
    const newAmazeCount = (profile?.amaze_count ?? 0) + 1;

    // "감탄" -- always +1 for a saved record, independent of whether an
    // item drops (5.2). Upsert, not update: insurance against the
    // profiles-row-creation trigger somehow not having run yet.
    const { error: amazeError } = await admin
      .from("profiles")
      .upsert({ id: userId, amaze_count: newAmazeCount }, { onConflict: "id" });
    if (amazeError) throw amazeError;

    // Dev-only escape hatch for the daily limit, off unless someone has
    // explicitly run `supabase secrets set ALLOW_TEST_DROPS=1` -- there's
    // no separate dev/prod Supabase project here, so this is a server-side
    // secret rather than anything a client request can control (a client
    // sending its own bypass flag would defeat the whole point). Unset the
    // secret (`supabase secrets unset ALLOW_TEST_DROPS`) once done testing;
    // nothing else turns this back off automatically.
    const bypassDailyLimit = Deno.env.get("ALLOW_TEST_DROPS") === "1";
    const alreadyDroppedToday = !bypassDailyLimit && profile?.last_drop_date === today;
    const eligibleForDrop = post.has_photo === true && !alreadyDroppedToday;

    if (!eligibleForDrop) {
      return jsonResponse({
        amazeCount: newAmazeCount,
        itemDropped: false,
        reason: !post.has_photo ? "no-photo" : "already-dropped-today",
      });
    }

    // Phase 1: guaranteed drop of the one seeded item, no rarity/color roll
    // yet (9, 5.4 -- "Phase 1은 확정 지급으로 시작해도 무방").
    const { error: insertError } = await admin.from("user_items").insert({
      user_id: userId,
      item_id: PHASE_1_ITEM_ID,
      color_hex: null,
      post_id: postId,
    });

    // A unique-constraint hit means they already own this exact item/color
    // combo -- expected once someone's already gotten the crown, since
    // Phase 1 has nothing else to roll. Anything else is a real error.
    const alreadyOwned = insertError?.code === UNIQUE_VIOLATION;
    if (insertError && !alreadyOwned) throw insertError;

    const { error: dropDateError } = await admin
      .from("profiles")
      .update({ last_drop_date: today })
      .eq("id", userId);
    if (dropDateError) throw dropDateError;

    const { data: item, error: itemError } = await admin
      .from("items")
      .select("id, name, svg_path")
      .eq("id", PHASE_1_ITEM_ID)
      .maybeSingle();
    if (itemError) throw itemError;

    return jsonResponse({
      amazeCount: newAmazeCount,
      itemDropped: !alreadyOwned,
      alreadyOwned,
      item,
    });
  } catch (error) {
    console.error("[drop-item]", error);
    return jsonResponse({ error: "internal-error" }, 500);
  }
});
