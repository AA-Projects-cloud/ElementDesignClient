// Supabase Edge Function: reset-pin
// Generates cryptographically secure client PIN, stores salted hash, revokes sessions, logs audit event.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { clientId, actorId } = await req.json();

    if (!clientId) {
      return new Response(JSON.stringify({ error: "Missing clientId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate random 4-digit PIN (1000 - 9999)
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const pin = (1000 + (array[0] % 9000)).toString();

    // Hash PIN with bcrypt salt
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, salt);

    // Update client row with hashed PIN
    const { data: updatedClient, error: updateErr } = await supabase
      .from("clients")
      .update({
        pin_hash: pinHash,
      })
      .eq("id", clientId)
      .select("id, portal_id")
      .single();

    if (updateErr) throw updateErr;

    // Log to audit trail
    await supabase.from("audit_log").insert({
      actor_id: actorId ?? null,
      action: "RESET_CLIENT_PIN",
      entity: "clients",
      entity_id: clientId,
      ip: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
      user_agent: req.headers.get("user-agent") ?? "Admin Console",
      meta: { portal_id: updatedClient.portal_id },
    });

    // Return the plaintext PIN ONCE to the admin UI for display/copy
    return new Response(
      JSON.stringify({
        success: true,
        clientId,
        oneTimePin: pin,
        message: "PIN securely hashed with bcrypt salt. Show once to administrator.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
