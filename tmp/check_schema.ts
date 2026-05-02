import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

async function check() {
  console.log("Checking owner columns...");
  const { data: ownerData, error: ownerError } = await supabase.from("owner").select("*").limit(1);
  if (ownerError) console.error("Owner Error:", ownerError);
  else if (ownerData && ownerData.length > 0) console.log("Owner Columns:", Object.keys(ownerData[0]));
  else console.log("Owner table is empty.");

  console.log("\nChecking pa columns...");
  const { data: paData, error: paError } = await supabase.from("pa").select("*").limit(1);
  if (paError) console.error("PA Error:", paError);
  else if (paData && paData.length > 0) console.log("PA Columns:", Object.keys(paData[0]));
  else console.log("PA table is empty.");
}

check();
