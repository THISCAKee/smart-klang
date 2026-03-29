// app/api/debug-storage/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
);

export async function GET() {
  const { data, error } = await supabaseAdmin.storage.listBuckets();
  if (error) return NextResponse.json({ error });
  return NextResponse.json({ buckets: data });
}
