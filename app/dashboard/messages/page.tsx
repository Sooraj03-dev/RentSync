'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatWindow } from '@/components/chat/ChatWindow';
import type { Conversation } from '@/types/chat';
import { MessageSquare, Search, Plus, X, Loader2 } from 'lucide-react';

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
function avatarColor(name: string) { return COLORS[name.charCodeAt(0) % COLORS.length]; }

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showNewChat, setShowNewChat] = useState(false);
  const [tenancies, setTenancies] = useState<any[]>([]);
  const [loadingTenancies, setLoadingTenancies] = useState(false);

  const supabase = createClient();

  const loadConversations = () => {
    fetch('/api/chat/conversations').then(r => r.json()).then(d => {
      setConversations(d.conversations ?? []);
      if (d.conversations?.length > 0 && !activeId) setActiveId(d.conversations[0].id);
    });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
    loadConversations();
  }, []);

  const openNewChatModal = async () => {
    setShowNewChat(true);
    setLoadingTenancies(true);
    // Fetch all active tenancies for this landlord
    const { data } = await supabase
      .from('tenancies')
      .select(`
        id, unit_number, tenant_id,
        properties!inner(name, owner_id),
        profiles!tenancies_tenant_id_fkey(name, email)
      `)
      .eq('status', 'active');
    
    // Filter out tenancies that already have a conversation
    const existingTenancyIds = new Set(conversations.map(c => c.tenancy_id));
    const available = (data ?? []).filter(t => t.tenant_id && !existingTenancyIds.has(t.id));
    setTenancies(available);
    setLoadingTenancies(false);
  };

  const createChat = async (tenancy: any) => {
    if (!userId) return;
    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        tenancy_id: tenancy.id,
        landlord_id: userId,
        tenant_id: tenancy.tenant_id,
      })
      .select('id')
      .single();

    if (conv) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_id: userId,
        sender_role: 'landlord',
        body: 'Chat started. Say hello!',
        msg_type: 'system',
      });
      await supabase.from('conversations').update({
        last_message: 'Chat started. Say hello!',
        last_message_at: new Date().toISOString(),
      }).eq('id', conv.id);
      
      setShowNewChat(false);
      loadConversations();
      setActiveId(conv.id);
      setMobileView('chat');
    }
  };

  const active = conversations.find(c => c.id === activeId);
  const filtered = conversations.filter(c =>
    c.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
    c.property_name.toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (id: string) => { setActiveId(id); setMobileView('chat'); };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 bg-white ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-900">Messages</h1>
            <button onClick={openNewChatModal} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1 text-center px-6">Click + to start chatting with a tenant.</p>
            </div>
          )}
          {filtered.map(c => (
            <button key={c.id} onClick={() => openChat(c.id)}
              className={`w-full text-left px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-start gap-3 ${activeId === c.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}>
              <div className={`w-10 h-10 rounded-full ${avatarColor(c.tenant_name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {initials(c.tenant_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">{c.tenant_name}</p>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {c.last_message_at ? timeAgo(c.last_message_at) : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {c.property_name} · {c.unit_number}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {c.last_message ?? 'No messages yet'}
                </p>
              </div>
              {c.landlord_unread > 0 && (
                <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-1">
                  {c.landlord_unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className={`flex-1 flex flex-col ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {active && userId ? (
          <div className="h-full relative">
            <button onClick={() => setMobileView('list')} className="md:hidden absolute top-3 left-3 z-10 text-slate-600 font-semibold text-sm">
              ← Back
            </button>
            <ChatWindow
              conversationId={active.id}
              currentUserId={userId}
              otherPartyName={active.tenant_name}
              propertyLabel={`${active.property_name} · Unit ${active.unit_number}`}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-3 text-slate-200" />
            <p className="font-medium text-slate-500">Select a conversation</p>
            <p className="text-sm mt-1">Pick a tenant from the left to start chatting</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Start New Chat</h2>
              <button onClick={() => setShowNewChat(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {loadingTenancies ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : tenancies.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No active tenants available for a new chat.<br/>
                  (They either already have a chat or haven't joined yet.)
                </div>
              ) : (
                <div className="space-y-2">
                  {tenancies.map(t => (
                    <button key={t.id} onClick={() => createChat(t)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50 text-left transition-colors">
                      <div className={`w-10 h-10 rounded-full ${avatarColor(t.profiles?.name ?? 'T')} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {initials(t.profiles?.name ?? 'T')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{t.profiles?.name ?? 'Unknown Tenant'}</p>
                        <p className="text-xs text-slate-500">{t.properties?.name} · Unit {t.unit_number}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
