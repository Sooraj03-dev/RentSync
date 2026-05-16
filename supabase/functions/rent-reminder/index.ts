// Supabase Edge Function — Rent Reminder
// Deploy: supabase functions deploy rent-reminder
// Trigger: pg_cron daily at 09:00 IST (03:30 UTC)
//   SELECT cron.schedule('rent-reminder-daily', '30 3 * * *', $$
//     SELECT net.http_post(
//       url := 'https://<project-ref>.functions.supabase.co/rent-reminder',
//       headers := '{"Authorization": "Bearer <anon-key>", "Content-Type": "application/json"}'::jsonb,
//       body := '{}'::jsonb
//     );
//   $$);

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from "npm:web-push";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL       = Deno.env.get('SITE_URL') ?? 'https://rentsync.app';

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  webpush.setVapidDetails(
    "mailto:team@rentsync.in",
    Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY") || "",
    Deno.env.get("VAPID_PRIVATE_KEY") || ""
  );

  const today = new Date();
  const targetDay = today.getDate() + 3;
  const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const { data: tenancies } = await supabase
    .from('tenancies')
    .select('id, unit_number, rent_amount, due_day, tenant_id, profiles(name, email), properties(name)')
    .eq('status', 'active')
    .eq('due_day', targetDay);

  let sent = 0;

  for (const tenancy of (tenancies ?? [])) {
    const profile  = tenancy.profiles  as any;
    const property = tenancy.properties as any;
    if (!profile?.email) continue;

    // Create pending row if not exists
    const { data: existing } = await supabase
      .from('rent_payments')
      .select('id')
      .eq('tenancy_id', tenancy.id)
      .eq('month_year', monthYear)
      .maybeSingle();

    if (!existing) {
      await supabase.from('rent_payments').insert({
        tenancy_id: tenancy.id,
        amount_paid: tenancy.rent_amount,
        month_year: monthYear,
        status: 'pending',
      });
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RentSync <noreply@rentsync.app>',
        to: [profile.email],
        subject: `Rent due in 3 days — ₹${Number(tenancy.rent_amount).toLocaleString('en-IN')}`,
        html: `<p>Hi ${profile.name ?? 'Tenant'},</p>
          <p>Your rent of <strong>₹${Number(tenancy.rent_amount).toLocaleString('en-IN')}</strong> for <strong>${property?.name} · ${tenancy.unit_number}</strong> is due in 3 days.</p>
          <p><a href="${SITE_URL}/tenant/rent">Pay Now →</a></p>`,
      }),
    });

    // Send push notification
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', tenancy.tenant_id);

    if (subs && subs.length > 0) {
      const payloadString = JSON.stringify({ 
        title: "Rent Due in 3 Days", 
        body: `₹${Number(tenancy.rent_amount).toLocaleString('en-IN')} due on ${targetDay}. Pay now via RentSync.` 
      });
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payloadString
          );
        } catch (err) {
          console.error("Push failed for endpoint", sub.endpoint, err);
        }
      }
    }

    sent++;
  }

  return new Response(JSON.stringify({ sent, monthYear }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
