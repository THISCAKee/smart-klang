// ไฟล์: app/api/get-tax-data/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string,
);

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    // 1. ดึงข้อมูล User
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, prefix, first_name, last_name")
      .eq("line_user_id", (session.user as any).id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let searchYear = year;
    if (!searchYear || searchYear === "ไม่ระบุปี") {
      // ถ้าไม่ได้ระบุปีมา ให้ค้นหาปีล่าสุดที่มีข้อมูลในตาราง pa ของผู้ใช้นี้
      const { data: latestPa } = await supabaseAdmin
        .from("pa")
        .select("annual")
        .eq("owner_id", user.id)
        .order("annual", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestPa && latestPa.annual) {
        searchYear = latestPa.annual;
      }
    }

    // ดึงรายการปีประเมินทั้งหมดในระบบ (ไม่กรอง owner_id เพื่อให้เห็นทุกปี)
    let availableYears: string[] = [];
    const { data: yearRows } = await supabaseAdmin.from("pa").select("annual");
    if (yearRows) {
      availableYears = Array.from(
        new Set(yearRows.map((r: any) => String(r.annual)).filter(Boolean)),
      ).sort((a, b) => Number(b) - Number(a));
    }

    let taxAmount = 0;
    let landPlots: any[] = []; // เตรียมตัวแปรเก็บรายการแปลงที่ดิน
    let buildings: any[] = []; // เตรียมตัวแปรเก็บรายการสิ่งปลูกสร้าง
    let signboards: any[] = []; // เตรียมตัวแปรเก็บรายการป้าย
    let totalLandPlotsAllYears = 0; // จำนวนแปลงที่ดินทั้งหมด (ทุกปี)

    if (searchYear) {
      // 2. ดึงข้อมูลภาษีจากตาราง pa
      const { data: paData, error: paError } = await supabaseAdmin
        .from("pa")
        .select("pa_tax")
        .eq("owner_id", user.id)
        .eq("annual", searchYear);

      if (!paError && paData) {
        taxAmount = paData.reduce(
          (sum, item) => sum + (Number(item.pa_tax) || 0),
          0,
        );
      }

      // ดึงข้อมูลป้าย (signboard) กรองตามเจ้าของและปี
      const { data: signData } = await supabaseAdmin
        .from("signboard")
        .select("s_name, s_desc, sign_type_id, sw, sl, no_side")
        .eq("owner_id", user.id)
        .eq("annual", searchYear);
      
      if (signData) {
        signboards = signData;
      }

      // 3. ดึง lid ทั้งหมดจาก land_owner ของ owner นี้
      const { data: landOwnerData, error: landOwnerError } = await supabaseAdmin
        .from("land_owner")
        .select("line_no, lid")
        .eq("owner_id", user.id);

      if (!landOwnerError && landOwnerData && landOwnerData.length > 0) {
        const lids = landOwnerData.map((item) => item.lid).filter(Boolean);
        totalLandPlotsAllYears = lids.length;

        // สร้าง map จาก lid → line_no (จาก land_owner)
        const lineNoMap: Record<string, string> = {};
        landOwnerData.forEach((item) => {
          if (item.lid) lineNoMap[item.lid.toString()] = item.line_no || "ไม่ระบุ";
        });

        if (lids.length > 0) {
          // นำ lid ไปกรองกับตาราง land พร้อมกรอง annual ตามปีที่เลือก
          const { data: landData } = await supabaseAdmin
            .from("land")
            .select("lid, ln, _dn, sn, r, y, w")
            .in("lid", lids)
            .eq("annual", searchYear);

          if (landData && landData.length > 0) {
            landPlots = landData.map((item) => ({
              line_no: item.lid ? lineNoMap[item.lid.toString()] : "ไม่ระบุ",
              ln: item.ln || "ไม่ระบุ",
              dn: item._dn || "ไม่ระบุ",
              sn: item.sn || "ไม่ระบุ",
              r: item.r !== null ? String(item.r) : "0",
              y: item.y !== null ? String(item.y) : "0",
              w: item.w !== null ? String(item.w) : "0",
            }));

            // ดึงข้อมูลสิ่งปลูกสร้าง (building) ที่เชื่อมกับ land (lid)
            const activeLids = landData.map(item => item.lid).filter(Boolean);
            if (activeLids.length > 0) {
              const { data: buildingData } = await supabaseAdmin
                .from("building")
                .select("address, moo, b_type, b_material, no_floor, all_area, notes, ref_lid")
                .in("ref_lid", activeLids);
              
              if (buildingData) {
                buildings = buildingData;
              }
            }
          }
        }
      }
    }

    // 4. ส่งข้อมูลทั้งหมดกลับไปให้หน้าเว็บ
    return NextResponse.json({
      success: true,
      userData: {
        prefix: user.prefix,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      taxAmount: taxAmount,
      landPlots: landPlots,
      buildings: buildings,
      signboards: signboards, // เพิ่มข้อมูลป้าย
      totalLandPlotsAllYears: totalLandPlotsAllYears, // จำนวนแปลงที่ดินทั้งหมด
      year: searchYear || "ไม่ระบุปี",
      availableYears: availableYears,
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
