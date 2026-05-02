// ไฟล์: app/api/get-tax-data/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string,
);

interface OwnerRow {
  owner_id: string;
  prefix?: string | null;
  fname: string;
  lname?: string | null;
}

interface UserLinkRow {
  id: string;
}

interface YearRow {
  annual: string | number | null;
}

interface TaxSummaryRow {
  fiscal_year?: string | number | null;
  owner_name: string;
  tax_assessed?: number | string | null;
  tax_paid?: number | string | null;
  tax_due?: number | string | null;
}

interface TaxSummary {
  fiscal_year?: string | number | null;
  owner_name?: string;
  tax_assessed: number;
  tax_paid: number;
  tax_due: number;
}

interface LandPlot {
  line_no: string;
  ln: string;
  dn: string;
  sn: string;
  r: string;
  y: string;
  w: string;
}

interface BuildingRow {
  address: string | null;
  moo: string | null;
  b_type: string | null;
  b_material: string | null;
  no_floor: number | null;
  all_area: number | null;
  notes: string | null;
  ref_lid: string | number | null;
}

interface SignboardRow {
  s_name: string | null;
  s_desc: string | null;
  sign_type_id: string | number | null;
  sw: number | null;
  sl: number | null;
  no_side: number | null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const searchIdCard = searchParams.get("idCard");
    const searchFirstName = searchParams.get("firstName");
    const searchLastName = searchParams.get("lastName");
    const searchOwnerId = searchParams.get("ownerId");

    // 1. ดึงข้อมูล User/Owner
    let owner: OwnerRow | null = null;

    if (searchOwnerId) {
      // ค้นหาดรูรหัสเจ้าของโดยตรง
      const { data } = await supabaseAdmin
        .from("owner")
        .select("*")
        .eq("owner_id", searchOwnerId)
        .maybeSingle();
      owner = data as OwnerRow | null;
    } else if (searchIdCard) {
      // ค้นหาตามเลขบัตรประชาชน (ใช้ pop_id ตามคลัง)
      const { data } = await supabaseAdmin
        .from("owner")
        .select("*")
        .eq("pop_id", searchIdCard)
        .maybeSingle();
      owner = data as OwnerRow | null;
    } else if (searchFirstName) {
      // ค้นหาตามชื่อจากตาราง owner
      let query = supabaseAdmin
        .from("owner")
        .select("*")
        .eq("fname", searchFirstName);
      
      if (searchLastName) {
        query = query.eq("lname", searchLastName);
      }
      
      const { data } = await query.maybeSingle();
      owner = data as OwnerRow | null;
    } else {
      // Default: ดึงข้อมูลตาม LINE User ID จากตาราง users เชื่อมไปตาราง owner
      const { data: userLink } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("line_user_id", session.user.id)
        .maybeSingle();
      
      if (userLink) {
        const { data } = await supabaseAdmin
          .from("owner")
          .select("*")
          .eq("owner_id", (userLink as UserLinkRow).id)
          .maybeSingle();
        owner = data as OwnerRow | null;
      }
    }

    // แปลงให้ตรงกับ format ที่โค้ดส่วนต่อไปต้องการใช้
    const user = owner ? { 
        id: owner.owner_id, 
        prefix: owner.prefix || "", 
        first_name: owner.fname, 
        last_name: owner.lname || "" 
    } : null;

    let searchYear = year;
    let availableYears: string[] = [];
    let taxAmount = 0;
    let landPlots: LandPlot[] = [];
    let buildings: BuildingRow[] = [];
    let signboards: SignboardRow[] = [];
    let taxSummary: TaxSummary | null = null;
    let signSummary: TaxSummary | null = null;
    let totalLandPlotsAllYears = 0;

    // ดึงรายการปีประเมินทั้งหมดในระบบ (ไม่กรอง owner_id เพื่อให้เห็นทุกปี)
    const { data: yearRows } = await supabaseAdmin.from("pa").select("annual");
    if (yearRows) {
      availableYears = Array.from(
        new Set(
          (yearRows as YearRow[])
            .map((r) => String(r.annual))
            .filter(Boolean),
        ),
      ).sort((a, b) => Number(b) - Number(a));
    }

    if (user) {
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

        taxSummary = null;
        try {
          const { data: summaryMatches } = await supabaseAdmin
            .from("tax_data")
            .select("*")
            .or(`owner_name.ilike.%${user.first_name}%,owner_name.ilike.%${user.last_name}%`)
            .eq("fiscal_year", String(searchYear));
          
          if (summaryMatches && summaryMatches.length > 0) {
            // คัดกรองเฉพาะคนที่มีชื่อและนามสกุลตรงกันจริงๆ (กรณีในตารางมีคนอื่นปนมาจากการ ilike)
            const actualMatches = (summaryMatches as TaxSummaryRow[]).filter((r) => 
                r.owner_name.includes(user.first_name) && 
                (user.last_name ? r.owner_name.includes(user.last_name) : true)
            );
            
            if (actualMatches.length > 0) {
               // รวมยอดทั้งหมดเข้าด้วยกัน
               const aggregated = actualMatches.reduce((acc, curr) => ({
                  fiscal_year: curr.fiscal_year, // ใช้ปีของรายการแรก
                  owner_name: curr.owner_name,   // ใช้ชื่อของรายการแรก
                  tax_assessed: (acc.tax_assessed || 0) + (Number(curr.tax_assessed) || 0),
                  tax_paid: (acc.tax_paid || 0) + (Number(curr.tax_paid) || 0),
                  tax_due: (acc.tax_due || 0) + (Number(curr.tax_due) || 0),
               }), { tax_assessed: 0, tax_paid: 0, tax_due: 0 } as TaxSummary);
               
               taxSummary = aggregated;
            }
          }
        } catch (err: unknown) {
            console.error("tax_data lookup failed:", getErrorMessage(err));
        }

        signSummary = null;
        try {
          const { data: signMatches } = await supabaseAdmin
            .from("sign_tax")
            .select("*")
            .or(`owner_name.ilike.%${user.first_name}%,owner_name.ilike.%${user.last_name}%`)
            .eq("fiscal_year", String(searchYear));
          
          if (signMatches && signMatches.length > 0) {
            const actualSignMatches = (signMatches as TaxSummaryRow[]).filter((r) => 
                r.owner_name.includes(user.first_name) && 
                (user.last_name ? r.owner_name.includes(user.last_name) : true)
            );
            
            if (actualSignMatches.length > 0) {
               signSummary = actualSignMatches.reduce((acc, curr) => ({
                  tax_assessed: (acc.tax_assessed || 0) + (Number(curr.tax_assessed) || 0),
                  tax_paid: (acc.tax_paid || 0) + (Number(curr.tax_paid) || 0),
                  tax_due: (acc.tax_due || 0) + (Number(curr.tax_due) || 0),
               }), { tax_assessed: 0, tax_paid: 0, tax_due: 0 } as TaxSummary);
            }
          }
        } catch (err: unknown) {
            console.error("sign_tax lookup failed:", getErrorMessage(err));
        }

        // ดึงข้อมูลป้าย (signboard) กรองตามเจ้าของและปี
        const { data: signData } = await supabaseAdmin
          .from("signboard")
          .select("s_name, s_desc, sign_type_id, sw, sl, no_side")
          .eq("owner_id", user.id)
          .eq("annual", searchYear);

        if (signData) {
          signboards = signData as SignboardRow[];
        }

        // 3. ดึง lid ทั้งหมดจาก land_owner ของ owner นี้
        const { data: landOwnerData, error: landOwnerError } = await supabaseAdmin
          .from("land_owner")
          .select("line_no, lid")
          .eq("owner_id", user.id);

        if (!landOwnerError && landOwnerData && landOwnerData.length > 0) {
          const lids = landOwnerData.map((item) => item.lid).filter(Boolean);
          // totalLandPlotsAllYears = lids.length; // ❌ ไม่นับรวมทุกปี

          // สร้าง map จาก lid → line_no (จาก land_owner)
          const lineNoMap: Record<string, string> = {};
          landOwnerData.forEach((item) => {
            if (item.lid)
              lineNoMap[item.lid.toString()] = item.line_no || "ไม่ระบุ";
          });

          if (lids.length > 0) {
            // นำ lid ไปกรองกับตาราง land พร้อมกรอง annual ตามปีที่เลือก
            const { data: landData } = await supabaseAdmin
              .from("land")
              .select("lid, ln, _dn, sn, r, y, w")
              .in("lid", lids)
              .eq("annual", searchYear);

            if (landData && landData.length > 0) {
              totalLandPlotsAllYears = landData.length; // ✅ แสดงเฉพาะปีที่ค้นหา
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
              const activeLids = landData
                .map((item) => item.lid)
                .filter(Boolean);
              if (activeLids.length > 0) {
                const { data: buildingData } = await supabaseAdmin
                  .from("building")
                  .select(
                    "address, moo, b_type, b_material, no_floor, all_area, notes, ref_lid",
                  )
                  .in("ref_lid", activeLids);

                if (buildingData) {
                  buildings = buildingData as BuildingRow[];
                }
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
        prefix: user?.prefix || "",
        firstName: user?.first_name || session.user.name || "ผู้ใช้งาน",
        lastName: user?.last_name || "",
      },
      taxAmount: taxAmount,
      landPlots: landPlots,
      buildings: buildings,
      signboards: signboards,
      taxSummary: taxSummary || null,
      signSummary: signSummary || null,
      totalLandPlotsAllYears: totalLandPlotsAllYears,
      year: searchYear || "ไม่ระบุปี",
      availableYears: availableYears,
    });
  } catch (error: unknown) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
