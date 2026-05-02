import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

interface OwnerSuggestionRow {
  owner_id: string;
  fname: string;
  lname: string | null;
  pop_id: string | null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type") || "name";

    if (!q || q.length < 1) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    let query = supabaseAdmin.from("owner").select("owner_id, fname, lname, pop_id");

    if (type === "idCard") {
      query = query.ilike("pop_id", `${q}%`);
    } else {
      // ค้นหาแบบยืดหยุ่นมากขึ้น (มีคำนั้นอยู่ในชื่อหรือนามสกุล)
      query = query.or(`fname.ilike.%${q}%,lname.ilike.%${q}%`);
    }

    const { data, error } = await query.limit(20);

    if (error) throw error;

    const suggestions = ((data || []) as OwnerSuggestionRow[]).map((item) => ({
      owner_id: item.owner_id,
      fname: item.fname,
      lname: item.lname,
      id_card: item.pop_id || ""
    }));

    return NextResponse.json({
      success: true,
      suggestions: suggestions,
    });
  } catch (error: unknown) {
    console.error("Suggestion error:", error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
