import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // verify ownership
    const { data: prop, error: propErr } = await supabase
      .from('properties')
      .select('unit_count, rent_price, pg_price_sharing')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single();

    if (propErr || !prop) throw new Error('Property not found');

    const count = prop.unit_count || 1;
    const rent = prop.rent_price || prop.pg_price_sharing || 0;

    // Check existing
    const { data: existing } = await supabase
      .from('tenancies')
      .select('unit_number')
      .eq('property_id', params.id);
    
    const existingUnits = new Set(existing?.map(t => t.unit_number));
    
    const inserts = [];
    for (let i = 1; i <= count; i++) {
      const unitNum = `Flat ${100 + i}`;
      if (!existingUnits.has(unitNum)) {
        inserts.push({
          property_id: params.id,
          unit_number: unitNum,
          rent_amount: rent,
          status: 'vacant',
          due_day: 1
        });
      }
    }

    if (inserts.length > 0) {
      const { error: insErr } = await supabase.from('tenancies').insert(inserts);
      if (insErr) throw insErr;
    }

    return NextResponse.json({ success: true, count: inserts.length });
  } catch (error: any) {
    console.error('Generate units error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
