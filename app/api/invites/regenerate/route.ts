import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateInviteCode } from '@/lib/utils/inviteCode';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { invite_id } = await req.json();

    // Fetch original invite
    const { data: old } = await supabase
      .from('property_invites')
      .select('*')
      .eq('id', invite_id)
      .eq('landlord_id', user.id)
      .single();
    if (!old) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

    // Revoke old
    await supabase.from('property_invites').update({ status: 'revoked' }).eq('id', invite_id);

    // Create new with same fields
    const code = await generateInviteCode(supabase);
    const { data: invite, error } = await supabase
      .from('property_invites')
      .insert({
        property_id: old.property_id,
        unit_number: old.unit_number,
        code,
        landlord_id: user.id,
        rent_amount: old.rent_amount,
        due_day: old.due_day,
        assigned_email: old.assigned_email,
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
