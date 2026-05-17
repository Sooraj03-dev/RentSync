import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/chat/read — mark messages as read for the current user
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversation_id } = await req.json();
    if (!conversation_id) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 });

    // Mark all unread messages from the other party as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation_id)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    // Determine if we're the tenant or landlord
    const { data: conv } = await supabase
      .from('conversations')
      .select('landlord_id, tenant_id')
      .eq('id', conversation_id)
      .single();

    if (conv) {
      if (conv.tenant_id === user.id) {
        await supabase.from('conversations').update({ tenant_unread: 0 }).eq('id', conversation_id);
      } else if (conv.landlord_id === user.id) {
        await supabase.from('conversations').update({ landlord_unread: 0 }).eq('id', conversation_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
