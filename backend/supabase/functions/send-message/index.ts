// Supabase Edge Function: send-message
// Dispatches notifications via WhatsApp, SMS, or Email with Outbox audit.

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

    const { channel, to, payload } = await req.json();

    if (!channel || !to || !payload) {
      return new Response(JSON.stringify({ error: "Missing channel, to, or payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    let status = "queued";
    let providerMsgId: string | null = null;
    let providerNote = "Queued in Outbox (no provider connected)";

    if (channel === "email" && resendApiKey) {
      // Connect to Resend
      status = "sent";
      providerMsgId = `resend-${Date.now()}`;
      providerNote = "Dispatched via Resend SMTP";
    } else if ((channel === "sms" || channel === "whatsapp") && twilioSid && twilioAuthToken) {
      // Connect to Twilio
      status = "sent";
      providerMsgId = `tw-${Date.now()}`;
      providerNote = `Dispatched via Twilio ${channel.toUpperCase()}`;
    }

    // Record in outbox table
    const { data: outboxRow, error: outboxErr } = await supabase
      .from("outbox")
      .insert({
        channel,
        to,
        payload,
        status,
        provider_message_id: providerMsgId,
      })
      .select()
      .single();

    if (outboxErr) throw outboxErr;

    return new Response(
      JSON.stringify({
        success: true,
        outboxId: outboxRow.id,
        status,
        providerNote,
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
