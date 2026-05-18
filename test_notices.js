const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient('https://uzlpmvhvhbsytyvkirux.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bHBtdmh2aGJzeXR5dmtpcnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTA2MTIsImV4cCI6MjA5NDQ2NjYxMn0.cw2CDVh3iWLRdYpjAqotz-RJeaPr6ZtSrxCGov-DBtE');

  console.log('Logging in as Ramesh...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ramesh@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }

  const user = authData.user;
  console.log('Logged in successfully, user ID:', user.id);

  console.log('Fetching properties...');
  const { data: props, error: propsError } = await supabase.from('properties').select('id, name').eq('owner_id', user.id);
  if (propsError) {
    console.error('Properties fetch failed:', propsError);
    return;
  }
  console.log('Properties:', props);

  if (props.length > 0) {
    const propId = props[0].id;
    console.log(`Fetching notices for property ${propId}...`);
    const { data: notices, error: noticesError } = await supabase.from('notices').select('*').eq('property_id', propId);
    if (noticesError) {
      console.error('Notices fetch failed:', noticesError);
    } else {
      console.log('Notices:', notices);
    }

    console.log('Trying to insert a notice...');
    const { data: inserted, error: insertError } = await supabase.from('notices').insert({
      property_id: propId,
      owner_id: user.id,
      title: 'Test Notice ' + new Date().toISOString(),
      body: 'This is a test notice from node script',
      pinned: false
    }).select();

    if (insertError) {
      console.error('Insert notice failed:', insertError);
    } else {
      console.log('Notice inserted successfully:', inserted);
    }
  } else {
    console.log('No properties found for this landlord.');
  }
}

run().catch(console.error);
