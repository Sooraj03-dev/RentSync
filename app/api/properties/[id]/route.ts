import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (body.total_units !== undefined) {
      body.unit_count = body.total_units;
      delete body.total_units;
    }

    const { error } = await supabase
      .from('properties')
      .update(body)
      .eq('id', params.id)
      .eq('owner_id', user.id); // Ensure RLS safety on top of DB policy

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Property PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Property DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
