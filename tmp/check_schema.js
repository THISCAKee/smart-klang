const { createClient } = require("@supabase/supabase-js");
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function check() {
  console.log("Checking owner columns...");
  const { data: ownerData, error: ownerError } = await supabase.from("owner").select("*").limit(1);
  if (ownerError) console.error("Owner Error:", ownerError);
  else if (ownerData && ownerData.length > 0) console.log("Owner Columns:", Object.keys(ownerData[0]));
  else console.log("Owner table is empty.");
}

check();
