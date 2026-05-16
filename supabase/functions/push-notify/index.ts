import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

// Setup VAPID keys for web-push
webpush.setVapidDetails(
  "mailto:team@rentsync.in",
  Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY") || "",
  Deno.env.get("VAPID_PRIVATE_KEY") || ""
);

serve(async (req) => {
  try {
    const payload = await req.json();
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // This webhook is triggered on `maintenance_requests` INSERT or UPDATE
    const record = payload.record;
    const type = payload.type; // 'INSERT' or 'UPDATE'

    let targetUserId = null;
    let pushTitle = "";
    let pushBody = "";

    if (type === 'INSERT') {
      // New ticket -> Notify landlord
      // 1. Find landlord_id from property
      const { data: tenancy } = await supabaseClient
        .from('tenancies')
        .select('property_id')
        .eq('id', record.tenancy_id)
        .single();
        
      if (tenancy) {
        const { data: prop } = await supabaseClient
          .from('properties')
          .select('landlord_id')
          .eq('id', tenancy.property_id)
          .single();
        targetUserId = prop?.landlord_id;
        pushTitle = `New maintenance ticket`;
        pushBody = record.title;
      }
    } else if (type === 'UPDATE' && payload.old_record.status !== record.status) {
      // Status updated -> Notify tenant
      const { data: tenancy } = await supabaseClient
        .from('tenancies')
        .select('tenant_id')
        .eq('id', record.tenancy_id)
        .single();
      targetUserId = tenancy?.tenant_id;
      pushTitle = `Ticket status updated`;
      pushBody = `Your ticket '${record.title}' is now ${record.status}`;
    }

    if (!targetUserId) {
      return new Response("No target user to notify", { status: 200 });
    }

    // Fetch user's push subscriptions
    const { data: subs } = await supabaseClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', targetUserId);

    if (subs && subs.length > 0) {
      const payloadString = JSON.stringify({ title: pushTitle, body: pushBody });
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            payloadString
          );
        } catch (err) {
          console.error("Failed to push to endpoint", sub.endpoint, err);
          // If 410 Gone, we should delete the subscription, but skip for now
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
