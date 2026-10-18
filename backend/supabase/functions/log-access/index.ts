// Supabase Edge Function: log-access
// Records tamper-evident audit log entries capturing caller IP, User-Agent, and metadata.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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

    const { actorId, action, entity, entityId, meta } = await req.json();

    const clientIp = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const userAgent = req.headers.get("user-agent") ?? "Unknown";

    const { data: logEntry, error } = await supabase
      .from("audit_log")
      .insert({
        actor_id: actorId ?? null,
        action: action ?? "UNSPECIFIED_ACTION",
        entity: entity ?? "system",
        entity_id: entityId ?? null,
        ip: clientIp,
        user_agent: userAgent,
        meta: meta ?? {},
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, logId: logEntry.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
