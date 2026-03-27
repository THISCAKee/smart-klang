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

    // ตรวจสอบว่าพบรายชื่อในฐานข้อมูลกองคลังหรือไม่
    // (ถ้ากรอกทั้งคู่แล้วไม่เจอ ลองหาแค่ชื่ออย่างเดียวตามเงื่อนไข 'นามสกุลไม่อยู่ในระบบให้เข้าได้')
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

    if (ownerError || !matchedOwnerData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลชื่อชุดนี้ในฐานข้อมูลกองคลัง กรุณาติดต่อเจ้าหน้าที่",
        },
        { status: 404 },
      );
    }

    const matchedOwnerId = matchedOwnerData.owner_id;

    // 2. ตรวจสอบว่ามีบัญชี LINE หรือชื่อนี้ถูกลงทะเบียนไปแล้วหรือยัง
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, line_user_id")
      .or(`id.eq.${matchedOwnerId},line_user_id.eq.${lineUserId}`)
      .maybeSingle();

    if (existingUser) {
      // ตรวจสอบว่าอะไรซ้ำ
      const isOwnerDuplicate = existingUser.id === matchedOwnerId;
      return NextResponse.json(
        {
          success: false,
          error: isOwnerDuplicate
            ? "ข้อมูลผู้เสียภาษีนี้ได้ทำการเชื่อมโยงกับบัญชี LINE ไปแล้ว"
            : "บัญชี LINE นี้ได้ทำการลงทะเบียนไปแล้ว",
        },
        { status: 400 },
      );
    }

    // 2. ถ้าเจอ ให้บันทึกข้อมูลลงตาราง users พร้อมกับเอา owner_id มาใส่ในฟิลด์ id
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: matchedOwnerId, // บังคับใส่ ID ให้ตรงกับตาราง owner
          line_user_id: lineUserId,
          prefix: prefix,
          first_name: firstName,
          last_name: lastName,
          id_card: idCard,
        },
      ]);

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: "ลงทะเบียนและเชื่อมโยงข้อมูลสำเร็จ",
    });
  } catch (error: any) {
    console.error("Error saving user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
