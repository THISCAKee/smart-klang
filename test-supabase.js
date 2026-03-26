require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
async function test() {
  const { data, error } = await supabase.from('owner').select('*').limit(3);
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
