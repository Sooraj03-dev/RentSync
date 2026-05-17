import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role ?? 'tenant';

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id, tenancy_id, landlord_id, tenant_id,
        last_message, last_message_at, landlord_unread, tenant_unread, created_at,
        tenancies(unit_number, properties(name))
      `)
      .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Fetch conv error:', error);
      throw error;
    }

    // Manually fetch profiles to avoid foreign key join issues
    const conversations = await Promise.all((data ?? []).map(async (c: any) => {
      // If user is landlord, get tenant's profile. If user is tenant, get landlord's profile.
      const otherPartyId = c.landlord_id === user.id ? c.tenant_id : c.landlord_id;
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', otherPartyId).single();
      
      return {
        id: c.id,
        tenancy_id: c.tenancy_id,
        landlord_id: c.landlord_id,
        tenant_id: c.tenant_id,
        tenant_name: profile?.name ?? 'Unknown',
        tenant_avatar: profile?.avatar_url ?? null,
        property_name: c.tenancies?.properties?.name ?? '—',
        unit_number: c.tenancies?.unit_number ?? '—',
        last_message: c.last_message,
        last_message_at: c.last_message_at,
        landlord_unread: c.landlord_unread ?? 0,
        tenant_unread: c.tenant_unread ?? 0,
        created_at: c.created_at,
      };
    }));

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error('API /conversations error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
