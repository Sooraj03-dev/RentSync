import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateInviteCode } from '@/lib/utils/inviteCode';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { property_id, unit_number, rent_amount, due_day, assigned_email } = await req.json();

    // Verify landlord owns property
    const { data: prop } = await supabase
      .from('properties')
      .select('id')
      .eq('id', property_id)
      .eq('owner_id', user.id)
      .single();
    if (!prop) return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 403 });

    // Revoke any existing pending invite for same property+unit
    await supabase
      .from('property_invites')
      .update({ status: 'revoked' })
      .eq('property_id', property_id)
      .eq('unit_number', unit_number)
      .eq('landlord_id', user.id)
      .eq('status', 'pending');

    const code = await generateInviteCode(supabase);

    const { data: invite, error } = await supabase
      .from('property_invites')
      .insert({
        property_id,
        unit_number,
        code,
        landlord_id: user.id,
        rent_amount,
        due_day,
        assigned_email: assigned_email || null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ invite });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
