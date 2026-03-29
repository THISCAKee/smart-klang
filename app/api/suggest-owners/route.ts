import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type") || "name";

    if (!q || q.length < 1) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    let query = supabaseAdmin.from("owner").select("*");

    if (type === "idCard") {
      query = query.ilike("pop_id", `${q}%`);
    } else {
      query = query.or(`fname.ilike.${q}%,lname.ilike.${q}%`);
    }

    const { data, error } = await query.limit(10);

    if (error) throw error;

    const suggestions = (data || []).map((item: any) => ({
      owner_id: item.owner_id,
      fname: item.fname,
      lname: item.lname,
      id_card: item.pop_id || ""
    }));

    return NextResponse.json({
      success: true,
      suggestions: suggestions,
    });
  } catch (error: any) {
    console.error("Suggestion error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
