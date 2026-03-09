import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-200">
      {/* 1. Navbar (แถบด้านบน) */}
      <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              SK
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              Smart <span className="text-blue-600">Klang</span>
            </span>
          </div>
          <div>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              สำหรับเจ้าหน้าที่
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section (ส่วนต้อนรับ) */}
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold tracking-wide">
          บริการประชาชนออนไลน์ 24 ชม.
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          ตรวจสอบยอดและจัดการ <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            ภาษีที่ดินและสิ่งปลูกสร้าง
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          สะดวกรวดเร็ว ไม่ต้องเดินทาง ตรวจสอบข้อมูลภาษีของคุณ
          พร้อมระบบแก้ไขแบบฟอร์ม ภ.ด.ส.5 และดูแผนที่ภูมิศาสตร์ได้ในที่เดียว
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-[#00B900] text-white rounded-xl shadow-lg shadow-green-200 hover:bg-[#00A000] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-bold text-lg"
          >
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.53 8.909 8.355 9.614.326.069.773.22.89.524.108.277.035.706.017.893-.021.217-.137.828-.168 1.011-.045.26-.208 1.01.884.55 1.092-.46 5.888-3.465 7.954-5.873C22.684 15.006 24 12.8 24 10.304z" />
            </svg>
            เข้าสู่ระบบด้วย LINE
          </Link>
          <p className="text-sm text-slate-400 sm:hidden">
            เข้าใช้งานง่าย ไม่ต้องจำรหัสผ่าน
          </p>
        </div>
      </main>

      {/* 3. Features Section (คุณสมบัติระบบ) */}
      <section className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-800 mb-12">
            บริการของเรา
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                ตรวจสอบยอดภาษี
              </h3>
              <p className="text-slate-600 leading-relaxed">
                เช็คสถานะการชำระภาษีที่ดิน สิ่งปลูกสร้าง และป้ายของคุณได้ทันที
                อัปเดตข้อมูลตรงจากฐานข้อมูลกองคลัง
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                ดูแผนที่ภูมิศาสตร์
              </h3>
              <p className="text-slate-600 leading-relaxed">
                แสดงตำแหน่งที่ดิน สิ่งปลูกสร้าง และป้ายของคุณบนแผนที่ดิจิทัล
                (GeoJSON) เพื่อความถูกต้องแม่นยำ
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                แก้ไข ภ.ด.ส.5 ออนไลน์
              </h3>
              <p className="text-slate-600 leading-relaxed">
                ขอแก้ไขข้อมูลเอกสาร PDF ผ่านระบบออนไลน์ได้ด้วยตัวเอง
                พร้อมระบบแจ้งเตือนเจ้าหน้าที่ผ่าน LINE ทันที
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 text-center text-slate-400 text-sm">
        <p>© 2026 Smart Klang Municipality. All rights reserved.</p>
      </footer>
    </div>
  );
}
