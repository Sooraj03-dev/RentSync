import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Map total_units to unit_count
    if (body.total_units !== undefined) {
      body.unit_count = body.total_units;
      delete body.total_units;
    }

    const payload = { ...body, owner_id: user.id };

    const { data, error } = await supabase
      .from('properties')
      .insert(payload)
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Property POST error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
