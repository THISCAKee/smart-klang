// ไฟล์: app/api/register-user/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// สร้างตัวแทนเชื่อมต่อ Supabase ด้วย Service Role Key เพื่อข้าม RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lineUserId, prefix, firstName, lastName, idCard } = body;

    // 0. ตรวจสอบว่ามีการกรอกเลขประจำตัวประชาชนมาหรือไม่
    if (!idCard || idCard.length !== 13) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุเลขประจำตัวประชาชน 13 หลัก" },
        { status: 400 },
      );
    }

    // 1. ค้นหา owner_id จากตาราง owner โดยเทียบ ชื่อ (และ นามสกุล ถ้ามีการกรอกมา)
    let query = supabaseAdmin
      .from("owner")
      .select("owner_id")
      .eq("fname", firstName);
    
    // ถ้านามสกุลถูกกรอกมาให้ใช้กรองด้วย
    if (lastName && lastName.trim() !== "") {
      query = query.eq("lname", lastName);
    }

    const { data: ownerData, error: ownerError } = await query.maybeSingle();

    // ค้นหารายชื่อสำรอง ถ้าใส่ชื่อ+นามสกุลไม่เจอ ลองหาแค่ชื่อ
    let matchedOwnerData = ownerData;
    if (!matchedOwnerData && lastName) {
       const { data: retryData } = await supabaseAdmin
        .from("owner")
        .select("owner_id")
        .eq("fname", firstName)
        .limit(1)
        .maybeSingle();
       matchedOwnerData = retryData;
    }

    const matchedOwnerId = matchedOwnerData?.owner_id;

    // 2. ตรวจสอบว่ามีบัญชี LINE นี้ถูกลงทะเบียนไปแล้วหรือยัง
    const { data: existingLineUser } = await supabaseAdmin
      .from("users")
      .select("id, line_user_id")
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    if (existingLineUser) {
      return NextResponse.json(
        { success: false, error: "บัญชี LINE นี้ได้ทำการลงทะเบียนไปแล้ว" },
        { status: 400 },
      );
    }

    // ตรวจสอบว่าชื่อผู้เสียภาษีนี้ (ถ้าเจอในระบบ) ถูกเชื่อมโยงไปแล้วหรือยัง
    if (matchedOwnerId) {
      const { data: existingOwnerUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", matchedOwnerId)
        .maybeSingle();

      if (existingOwnerUser) {
        return NextResponse.json(
          { success: false, error: "ข้อมูลผู้เสียภาษีนี้ได้ทำการเชื่อมโยงกับบัญชี LINE อื่นไปแล้ว" },
          { status: 400 },
        );
      }
    }

    // 3. บันทึกข้อมูลลงตาราง users
    const userData: any = {
      line_user_id: lineUserId,
      prefix: prefix,
      first_name: firstName,
      last_name: lastName,
      id_card: idCard,
    };

    // ถ้าเจอเจ้าของในระบบ ให้ใช้ ID เดียวกัน (เพื่อ Join ข้อมูลภาษีได้)
    if (matchedOwnerId) {
      userData.id = matchedOwnerId;
    } else {
      // ✅ กรณีไม่เจอในระบบกองคลัง (ใครก็ได้)
      // ต้องสร้าง ID ใหม่ให้โดยไม่ให้ซ้ำกับที่มีอยู่
      try {
        const { data: maxIdRow } = await supabaseAdmin
          .from("users")
          .select("id")
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // ถ้ามีข้อมูลในตารางแล้ว ให้ใช้ตัวที่มากที่สุด + 1 
        // เริ่มต้นที่ 900000 เพื่อไม่ให้ไปทับกับช่วง owner_id ปกติ
        const maxId = maxIdRow ? Number(maxIdRow.id) : 900000;
        userData.id = maxId + 1;
      } catch (e) {
        // Fallback กรณีหา Max ไม่ได้ (อาจจะตารางว่าง)
        userData.id = Date.now(); // ใช้ Timestamp เป็น ID ชั่วคราว (ถ้า type เป็น bigint)
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert([userData]);

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: "ลงทะเบียนสำเร็จ",
    });
  } catch (error: any) {
    console.error("Error saving user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
