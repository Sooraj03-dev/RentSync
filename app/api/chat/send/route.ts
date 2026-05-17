import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversation_id, body, msg_type = 'text', file_url, file_name } = await req.json();
    if (!conversation_id || !body?.trim()) {
      return NextResponse.json({ error: 'conversation_id and body required' }, { status: 400 });
    }

    // Determine sender role from profiles
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const senderRole = profile?.role ?? 'tenant';

    // Rely on database RLS (msg_parties_insert) to prevent unauthorized messages
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id: user.id,
        sender_role: senderRole,
        body: body.trim(),
        msg_type,
        file_url: file_url || null,
        file_name: file_name || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Message insert error:', error);
      return NextResponse.json({ error: `Message insert failed: ${error.message}` }, { status: 403 });
    }

    const unreadField = senderRole === 'landlord' ? 'tenant_unread' : 'landlord_unread';
    const { data: currConv } = await supabase.from('conversations').select(unreadField).eq('id', conversation_id).single();
    const currentUnread = (currConv as any)?.[unreadField] ?? 0;

    const { error: convErr } = await supabase
      .from('conversations')
      .update({
        last_message: msg_type === 'text' ? body.trim().slice(0, 80) : `📎 ${file_name ?? 'File'}`,
        last_message_at: new Date().toISOString(),
        [unreadField]: currentUnread + 1,
      })
      .eq('id', conversation_id);

    if (convErr) {
      console.error('Conversation update error:', convErr);
    }

    return NextResponse.json({ message });
  } catch (err: any) {
    console.error('API /chat/send error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
