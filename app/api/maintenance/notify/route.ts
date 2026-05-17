import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { tenancy_id, title, category } = await request.json();
  if (!tenancy_id || !title) return NextResponse.json({ error: 'tenancy_id and title required' }, { status: 400 });

  const supabase = createClient();

  // Get landlord email for the tenancy
  const { data: tenancy } = await supabase
    .from('tenancies')
    .select('unit_number, properties(name, owner_id, profiles(email, name))')
    .eq('id', tenancy_id)
    .single();

  if (!tenancy) return NextResponse.json({ ok: true }); // fail silently

  const props = tenancy.properties as any;
  const landlordEmail = props?.profiles?.email;
  const landlordName = props?.profiles?.name ?? 'Landlord';
  const propName = props?.name ?? 'Property';
  const unit = tenancy.unit_number ?? '—';

  if (!landlordEmail || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true }); // skip if no email / API key
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RentSync <noreply@rentsync.app>',
      to: [landlordEmail],
      subject: `🔧 New Maintenance Request — ${propName} · ${unit}`,
      html: `
        <p>Hi ${landlordName},</p>
        <p>A new maintenance request has been submitted:</p>
        <ul>
          <li><strong>Title:</strong> ${title}</li>
          <li><strong>Category:</strong> ${category}</li>
          <li><strong>Unit:</strong> ${unit}</li>
          <li><strong>Property:</strong> ${propName}</li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/dashboard/maintenance">View in Dashboard →</a></p>
        <p style="color:#64748b;font-size:12px">RentSync · Automated Alert</p>
      `,
    }),
  });

  return NextResponse.json({ ok: true });
}
