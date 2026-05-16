import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tenancy_id = searchParams.get('tenancy_id');
  const doc_type   = searchParams.get('doc_type') ?? 'other';
  const file_name  = searchParams.get('file_name') ?? 'document';

  if (!tenancy_id) return NextResponse.json({ error: 'tenancy_id required' }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ext = file_name.split('.').pop() ?? 'bin';
  const path = `${tenancy_id}/${user.id}-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path });
}
