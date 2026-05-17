'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/types/chat';
import { Send, Paperclip, ArrowDown, X, Download, Image as ImageIcon } from 'lucide-react';

interface Props {
  conversationId: string;
  currentUserId: string;
  otherPartyName: string;
  propertyLabel?: string;
  quickPrompts?: string[];
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function ChatWindow({ conversationId, currentUserId, otherPartyName, propertyLabel, quickPrompts }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [newMsgPill, setNewMsgPill] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const isNearBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  const scrollToBottom = (force = false) => {
    if (force || isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadMessages = useCallback(async (cursor?: string) => {
    const url = `/api/chat/messages?conversation_id=${conversationId}${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    return data;
  }, [conversationId]);

  useEffect(() => {
    loadMessages().then(data => {
      setMessages(data.messages ?? []);
      setNextCursor(data.next_cursor ?? null);
      setTimeout(() => scrollToBottom(true), 50);
    });

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload: any) => {
        const newMsg = payload.new as Message;
        setMessages(prev => [...prev, newMsg]);
        if (newMsg.sender_id !== currentUserId) {
          if (isNearBottom()) {
            setTimeout(() => scrollToBottom(true), 50);
          } else {
            setNewMsgPill(true);
          }
        } else {
          setTimeout(() => scrollToBottom(true), 50);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId, loadMessages, supabase]);

  const handleLoadOlder = async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    const data = await loadMessages(nextCursor);
    setMessages(prev => [...(data.messages ?? []), ...prev]);
    setNextCursor(data.next_cursor ?? null);
    setLoadingOlder(false);
    // Maintain scroll position
    setTimeout(() => {
      if (el) el.scrollTop = el.scrollHeight - prevScrollHeight;
    }, 50);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < 80) handleLoadOlder();
    if (isNearBottom()) setNewMsgPill(false);
  };

  const sendMessage = async (body = input.trim(), msg_type = 'text', file_url?: string, file_name?: string) => {
    if (!body && !file_url) return;
    setSending(true);
    setInput('');
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, body: body || file_name || 'File', msg_type, file_url, file_name }),
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { alert('File too large (max 10MB)'); return; }

    // Upload to Supabase storage
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `${conversationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
    if (error) { alert('Upload failed'); return; }
    const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(path);
    await sendMessage(file.name, isImage ? 'image' : 'document', publicUrl, file.name);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-3 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {otherPartyName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{otherPartyName}</p>
          {propertyLabel && <p className="text-xs text-slate-400">{propertyLabel}</p>}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {nextCursor && (
          <div className="text-center">
            <button onClick={handleLoadOlder} disabled={loadingOlder}
              className="text-xs text-blue-600 hover:underline font-semibold">
              {loadingOlder ? 'Loading…' : '↑ Load older messages'}
            </button>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.sender_id === currentUserId;
          const isSystem = msg.msg_type === 'system';
          const showDate = i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at);

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    {formatDateSeparator(msg.created_at)}
                  </span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>
              )}

              {isSystem ? (
                <p className="text-center text-xs text-slate-400 italic my-2">{msg.body}</p>
              ) : (
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {msg.msg_type === 'image' && msg.file_url ? (
                      <button onClick={() => setLightboxUrl(msg.file_url!)} className="rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity">
                        <img src={msg.file_url} alt={msg.file_name ?? 'Image'} className="w-[180px] h-[120px] object-cover" />
                      </button>
                    ) : msg.msg_type === 'document' && msg.file_url ? (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isOwn ? 'bg-blue-600 border-blue-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                        <Download className="w-4 h-4 shrink-0" />
                        <a href={msg.file_url} download={msg.file_name} target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline truncate max-w-[140px]">
                          {msg.file_name ?? 'Download'}
                        </a>
                      </div>
                    ) : (
                      <div className={`px-3 py-2 rounded-2xl text-sm ${isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                        {msg.body}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 px-1">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* New messages pill */}
      {newMsgPill && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
          <button onClick={() => { scrollToBottom(true); setNewMsgPill(false); }}
            className="flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
            <ArrowDown className="w-3 h-3" /> New messages
          </button>
        </div>
      )}

      {/* Quick prompt chips — shown when chat is fresh (0 real messages) */}
      {quickPrompts && messages.filter(m => m.msg_type !== 'system').length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => sendMessage(prompt)}
              className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-400 transition-colors font-medium whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-slate-200 px-3 py-3 flex items-end gap-2 shrink-0">
        <label className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1.5">
          <Paperclip className="w-5 h-5" />
          <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          style={{ resize: 'none' }}
          className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 max-h-[120px] overflow-y-auto"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2">
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxUrl} alt="" className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
