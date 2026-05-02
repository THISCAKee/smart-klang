# Smart Klang

ระบบตรวจสอบข้อมูลภาษีสำหรับประชาชน สร้างด้วย Next.js App Router, NextAuth LINE OAuth และ Supabase

## Development

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000`

## Production Checks

รันคำสั่งเหล่านี้ก่อน deploy หรือก่อน merge เข้า branch production:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm audit --audit-level=moderate
```

## Environment Variables

ต้องตั้งค่าใน Vercel Project Settings และใน `.env.local` สำหรับเครื่อง local:

```bash
NEXTAUTH_SECRET=
NEXTAUTH_URL=
LINE_CLIENT_ID=
LINE_CLIENT_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE=
ADMIN_EMAILS=
```

ค่า production ที่แนะนำ:

- `NEXTAUTH_URL` ต้องเป็น production URL ของ Vercel เช่น `https://your-domain.vercel.app`
- `NEXTAUTH_SECRET` ต้องเป็น secret ที่สุ่มยาวพอและเหมือนกันทุก deploy
- `SUPABASE_SERVICE_ROLE` ใช้เฉพาะฝั่ง server เท่านั้น ห้าม expose ใน client
- `ADMIN_EMAILS` เป็นรายการอีเมลเจ้าหน้าที่ คั่นด้วย comma เช่น `admin@example.com,finance@example.com`
- ถ้าไม่ตั้ง `ADMIN_EMAILS` ระบบจะอนุญาต Supabase Auth user ทุกคนที่ login สำเร็จให้เข้าหน้า admin
- ไม่ต้องตั้ง `ENABLE_DEBUG_API` ใน production

## Admin Dashboard

ระบบ admin ใช้ Supabase Auth email/password:

- หน้า login เจ้าหน้าที่: `/admin/login`
- หน้า dashboard: `/admin/dashboard`
- เมนู "สำหรับเจ้าหน้าที่" จากหน้าแรกจะไปที่ `/admin/login`

ก่อนใช้งาน dashboard ให้สร้าง admin user ใน Supabase Auth และแนะนำให้ตั้ง `ADMIN_EMAILS` บน Vercel ให้ตรงกับอีเมล admin user

## Activity Logs Table

รัน SQL นี้ใน Supabase SQL Editor เพื่อเก็บ log การ login ผ่าน LINE และการค้นหา:

```sql
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('line_login', 'search')),
  line_user_id text,
  line_display_name text,
  owner_id text,
  search_type text,
  search_query text,
  search_year text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx
  on public.activity_logs (created_at desc);

create index if not exists activity_logs_line_user_id_idx
  on public.activity_logs (line_user_id);

alter table public.activity_logs enable row level security;
```

API ของระบบใช้ `SUPABASE_SERVICE_ROLE` ฝั่ง server ในการเขียนและอ่าน log ดังนั้นไม่จำเป็นต้องเปิด RLS policy ให้ client อ่านตารางนี้โดยตรง

## Debug APIs

โปรเจคมี debug endpoints สำหรับตรวจ storage และ column ระหว่างพัฒนา:

- `/api/debug-storage`
- `/api/debug-columns`

ใน production endpoints เหล่านี้จะตอบ `404` เสมอ ถึงแม้มีการตั้ง `ENABLE_DEBUG_API=true` ก็ตาม เพื่อป้องกันการเปิดเผยข้อมูลผ่าน service role key

## Deployment Notes

- Vercel ต้องมี environment variables ครบตามรายการด้านบน
- LINE Login callback URL ต้องชี้กลับมาที่ production domain
- Supabase table/schema ต้องตรงกับ API ที่ใช้งาน เช่น `users`, `owner`, `pa`, `tax_data`, `sign_tax`, `land_owner`, `land`, `building`, `signboard`
- หลังเปลี่ยน dependency ให้รัน production build ในเครื่องก่อน deploy

## Security Notes

- ห้าม commit `.env.local` หรือไฟล์ที่มี secret
- หลีกเลี่ยงการเพิ่ม debug route ที่อ่านข้อมูลผ่าน `SUPABASE_SERVICE_ROLE` โดยไม่มี guard
- ตรวจ `npm audit` เป็นระยะ เพราะ Next.js และ auth dependency มี advisory เปลี่ยนตามเวลา
