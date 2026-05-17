import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/invites/accept — tenant JWT
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'tenant') {
      return NextResponse.json({ error: 'Only tenants can accept invites' }, { status: 403 });
    }

    const { invite_id } = await req.json();
    if (!invite_id) return NextResponse.json({ error: 'invite_id required' }, { status: 400 });

    // Fetch invite (readable by all — tenant_read_by_code policy)
    const { data: invite } = await supabase
      .from('property_invites')
      .select('*')
      .eq('id', invite_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (!invite) return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 });
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    // Check not already a tenant here
    let tenancyId: string;
    const { data: existing } = await supabase
      .from('tenancies')
      .select('id')
      .eq('property_id', invite.property_id)
      .eq('tenant_id', user.id)
      .maybeSingle();

    if (existing) {
      tenancyId = existing.id;
      // We don't return 409. We just proceed to fix the invite status if it was left pending.
    } else {
      // Create tenancy using standard client
      const { data: tenancy, error: tenancyErr } = await supabase
        .from('tenancies')
        .insert({
          property_id: invite.property_id,
          tenant_id: user.id,
          unit_number: invite.unit_number,
          rent_amount: invite.rent_amount,
          due_day: invite.due_day,
          status: 'active',
          invite_id: invite.id,
        })
        .select()
        .single();

      if (tenancyErr) {
        console.error('Tenancy insert err:', tenancyErr);
        throw tenancyErr;
      }
      tenancyId = tenancy.id;
    }

    // Mark invite accepted
    await supabase.from('property_invites').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      tenant_id: user.id,
    }).eq('id', invite_id);

    // Mark profile onboarded
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id);

    // Check if conversation already exists for this tenancy
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('tenancy_id', tenancyId)
      .maybeSingle();

    let conversationId = existingConv?.id ?? null;

    if (!conversationId) {
      // Create conversation
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          tenancy_id: tenancy.id,
          landlord_id: invite.landlord_id,
          tenant_id: user.id,
        })
        .select('id')
        .single();

      if (convErr) {
        console.error('Conversation creation failed:', convErr.message);
      } else if (conv) {
        conversationId = conv.id;
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          sender_id: user.id,
          sender_role: 'tenant',
          body: `Welcome! You've joined Unit ${invite.unit_number ?? ''}. Say hello to your landlord 👋`,
          msg_type: 'system',
        });
        await supabase.from('conversations').update({
          last_message: `You've joined Unit ${invite.unit_number ?? ''}. Say hello! 👋`,
          last_message_at: new Date().toISOString(),
        }).eq('id', conv.id);
      }
    }

    return NextResponse.json({ tenancy, conversation_id: conversationId });
  } catch (err: any) {
    console.error('Accept invite error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
