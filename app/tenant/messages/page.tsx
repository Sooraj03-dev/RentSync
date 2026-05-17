'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatWindow } from '@/components/chat/ChatWindow';
import type { Conversation } from '@/types/chat';
import { MessageSquare, Search, Plus } from 'lucide-react';

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  if (Math.floor(h / 24) === 1) return 'Yesterday';
  return `${Math.floor(h / 24)}d ago`;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const TENANT_QUICK_PROMPTS = [
  'Is this room still available? What is the earliest possible move-in date?',
  'Are meals included in the rent? What amenities are available — WiFi, AC, laundry, parking?',
  'How much is the security deposit? How many months of rent is required upfront?',
  'Can I schedule a visit to see the room this weekend? What time works for you?',
  'Are electricity, water, and maintenance charges included, or billed separately?',
  'Is the room fully furnished? Does it come with a bed, wardrobe, study table, and mattress?',
  'What is the notice period required if I decide to vacate?',
];

export default function TenantMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [creating, setCreating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
    fetch('/api/chat/conversations').then(r => r.json()).then(d => {
      const convs = d.conversations ?? [];
      setConversations(convs);
      if (convs.length > 0) { setActiveId(convs[0].id); setMobileView('chat'); }
    });
  }, []);

  const active = conversations.find(c => c.id === activeId);
  const filtered = conversations.filter(c =>
    c.property_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.tenant_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (id: string) => { setActiveId(id); setMobileView('chat'); };

  const startChatWithLandlord = async () => {
    if (!userId || creating) return;
    setCreating(true);

    // Step 1: Get active tenancy (basic columns only — no join to avoid RLS)
    const { data: tenancy, error: tenancyError } = await supabase
      .from('tenancies')
      .select('id, property_id, invite_id')
      .eq('tenant_id', userId)
      .eq('status', 'active')
      .single();

    if (tenancyError || !tenancy) {
      alert('Could not find your active tenancy: ' + (tenancyError?.message ?? 'not found'));
      setCreating(false);
      return;
    }

    // Step 2: Get landlord_id from property_invites (tenants can read these)
    let landlordId: string | null = null;

    if (tenancy.invite_id) {
      const { data: invite } = await supabase
        .from('property_invites')
        .select('landlord_id')
        .eq('id', tenancy.invite_id)
        .single();
      landlordId = invite?.landlord_id ?? null;
    }

    // Fallback: look for ANY accepted invite for this property
    if (!landlordId) {
      const { data: invite } = await supabase
        .from('property_invites')
        .select('landlord_id')
        .eq('property_id', tenancy.property_id)
        .limit(1)
        .single();
      landlordId = invite?.landlord_id ?? null;
    }

    if (!landlordId) {
      alert('Could not identify the landlord. Please ask them to start the chat from their dashboard.');
      setCreating(false);
      return;
    }

    // Step 3: Create the conversation (or get existing)
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        tenancy_id: tenancy.id,
        tenant_id: userId,
        landlord_id: landlordId,
      })
      .select('id')
      .single();

    let finalConvId = conv?.id;

    if (convError) {
      if (convError.code === '23505' || convError.message.includes('unique constraint')) {
        // Conversation already exists! Just fetch it.
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('tenancy_id', tenancy.id)
          .single();
        if (existing) {
          finalConvId = existing.id;
        } else {
          alert('Failed to find existing conversation.');
          setCreating(false);
          return;
        }
      } else {
        alert('Failed to create conversation: ' + convError.message);
        setCreating(false);
        return;
      }
    }

    if (finalConvId) {
      // Try to send initial message, but don't block if it fails
      const { error: msgErr } = await supabase.from('messages').insert({
        conversation_id: finalConvId,
        sender_id: userId,
        sender_role: 'tenant',
        body: 'Chat started. Say hello! 👋',
        msg_type: 'system',
      });
      if (msgErr) console.error("Message insert error:", msgErr);

      await supabase.from('conversations').update({
        last_message: 'Chat started. Say hello! 👋',
        last_message_at: new Date().toISOString(),
      }).eq('id', finalConvId);
      
      window.location.reload();
    } else {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-900">Messages</h1>
            <button 
              onClick={startChatWithLandlord} 
              disabled={creating}
              className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 px-4 text-center">
              <MessageSquare className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1 text-center px-6">Click + to start chatting with your landlord.</p>
            </div>
          ) : filtered.map(c => (
            <button key={c.id} onClick={() => openChat(c.id)}
              className={`w-full text-left px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-start gap-3 ${activeId === c.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}>
              {/* Landlord purple avatar */}
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials(c.property_name ?? 'L')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">{c.property_name}</p>
                  <span className="text-[10px] text-slate-400 shrink-0">{c.last_message_at ? timeAgo(c.last_message_at) : ''}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">Unit {c.unit_number}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{c.last_message ?? 'No messages yet'}</p>
              </div>
              {c.tenant_unread > 0 && (
                <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-1">
                  {c.tenant_unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`flex-1 flex flex-col ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {active && userId ? (
          <div className="h-full relative">
            <button onClick={() => setMobileView('list')} className="md:hidden absolute top-3 left-3 z-10 text-slate-600 font-semibold text-sm">← Back</button>
            <ChatWindow
              conversationId={active.id}
              currentUserId={userId}
              otherPartyName={active.property_name}
              propertyLabel={`Unit ${active.unit_number}`}
              quickPrompts={TENANT_QUICK_PROMPTS}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-3 text-slate-200" />
            <p className="font-medium text-slate-500">No conversation selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
