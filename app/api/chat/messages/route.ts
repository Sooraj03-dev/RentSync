import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversation_id = searchParams.get('conversation_id');
    const cursor = searchParams.get('cursor');
    if (!conversation_id) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 });

    // Verify user is party of conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, landlord_id, tenant_id')
      .eq('id', conversation_id)
      .single();
    if (!conv || (conv.landlord_id !== user.id && conv.tenant_id !== user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(40);

    if (cursor) query = query.lt('created_at', cursor);

    const { data: messages, error } = await query;
    if (error) throw error;

    // Mark messages as read (from other sender)
    const unreadIds = (messages ?? [])
      .filter(m => m.sender_id !== user.id && !m.is_read)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
    }

    // Reset landlord unread count
    await supabase
      .from('conversations')
      .update({ landlord_unread: 0 })
      .eq('id', conversation_id)
      .eq('landlord_id', user.id);

    const reversed = [...(messages ?? [])].reverse();
    const next_cursor = messages && messages.length === 40 ? messages[messages.length - 1].created_at : null;

    return NextResponse.json({ messages: reversed, next_cursor });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
