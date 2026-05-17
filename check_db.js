const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  const { data, error } = await supabase.from('tenancies').select('id, unit_number').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success! unit_number exists.');
  }
}

checkSchema();
