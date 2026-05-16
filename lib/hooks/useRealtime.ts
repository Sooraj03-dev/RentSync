'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export function useRealtime<T = Record<string, unknown>>(
  table: string,
  callback: (payload: { eventType: RealtimeEvent; new: T; old: T }) => void,
  filter?: string
) {
  useEffect(() => {
    const supabase = createClient();

    let channel: RealtimeChannel = supabase.channel(`rt-${table}-${filter ?? 'all'}`);

    channel = channel
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: unknown) => {
          callback(payload as { eventType: RealtimeEvent; new: T; old: T });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, callback]);
}
