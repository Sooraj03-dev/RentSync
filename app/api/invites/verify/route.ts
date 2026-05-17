import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/invites/verify — public, verify code or invite_id
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const body = await req.json();
    const { code, invite_id } = body;

    let query = supabase
      .from('property_invites')
      .select('*, properties(name, address)')
      .in('status', ['pending']);

    if (invite_id) {
      query = query.eq('id', invite_id) as any;
    } else if (code) {
      query = query.eq('code', code.toUpperCase()) as any;
    } else {
      return NextResponse.json({ error: 'code or invite_id required' }, { status: 400 });
    }

    const { data: invite, error } = await (query as any).maybeSingle();
    if (error) throw error;
    if (!invite) return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 });

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      await supabase.from('property_invites').update({ status: 'expired' }).eq('id', invite.id);
      return NextResponse.json({ error: 'This invite code has expired' }, { status: 410 });
    }

    return NextResponse.json({
      invite: {
        id: invite.id,
        unit_number: invite.unit_number,
        rent_amount: invite.rent_amount,
        due_day: invite.due_day,
        expires_at: invite.expires_at,
        property_name: (invite.properties as any)?.name,
        property_address: (invite.properties as any)?.address,
        property_id: invite.property_id,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
