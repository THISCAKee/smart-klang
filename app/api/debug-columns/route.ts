// app/api/debug-columns/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
);

export async function GET() {
  const { data } = await supabaseAdmin.from("land").select("*").limit(1);
  if (data && data.length > 0) {
    return NextResponse.json({ columns: Object.keys(data[0]), sample: data[0] });
  }
  return NextResponse.json({ error: "No data" });
}
