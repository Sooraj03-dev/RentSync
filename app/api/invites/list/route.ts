import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get('property_id');

    let query = supabase
      .from('property_invites')
      .select('*')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (property_id) query = query.eq('property_id', property_id);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ invites: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
