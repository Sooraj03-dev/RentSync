import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Called manually or from a cron job to send rent reminders
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const today = new Date();
  const targetDay = today.getDate() + 3;
  const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Find tenancies with due_day = today+3
  const { data: tenancies } = await supabase
    .from('tenancies')
    .select(`
      id, unit_number, rent_amount, due_day, tenant_id,
      profiles(name, email),
      properties(name)
    `)
    .eq('status', 'active')
    .eq('due_day', targetDay);

  if (!tenancies || tenancies.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const tenancy of tenancies) {
    const profile = tenancy.profiles as any;
    const property = tenancy.properties as any;

    if (!profile?.email) continue;

    // Create pending payment row if none exists
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

    if (!process.env.RESEND_API_KEY) continue;

    // Send reminder email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RentSync <noreply@rentsync.app>',
        to: [profile.email],
        subject: `Rent due in 3 days — ₹${Number(tenancy.rent_amount).toLocaleString('en-IN')}`,
        html: `
          <p>Hi ${profile.name ?? 'Tenant'},</p>
          <p>This is a friendly reminder that your rent of <strong>₹${Number(tenancy.rent_amount).toLocaleString('en-IN')}</strong> for <strong>${property?.name} · ${tenancy.unit_number}</strong> is due in 3 days (on ${targetDay}th).</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/tenant/rent">Pay Now →</a></p>
          <p style="color:#64748b;font-size:12px">RentSync · Automated Reminder</p>
        `,
      }),
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
