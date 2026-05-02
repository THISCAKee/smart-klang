"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ActivityLog {
  id: string;
  event_type: "line_login" | "search";
  line_user_id: string | null;
  line_display_name: string | null;
  owner_id: string | null;
  search_type: string | null;
  search_query: string | null;
  search_year: string | null;
  created_at: string;
}

function formatThaiDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/admin/login");
      return;
    }

    setAdminEmail(session.user.email ?? "");
    setErrorMessage("");
    setIsLoading(true);

    const response = await fetch("/api/admin/activity-logs", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.status === 401) {
      await supabase.auth.signOut();
      router.replace("/admin/login");
      return;
    }

    const result = await response.json();
    if (!response.ok) {
      setErrorMessage(result.error ?? "ไม่สามารถโหลดข้อมูล log ได้");
      setIsLoading(false);
      return;
    }

    setLogs(result.logs ?? []);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchLogs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  const totals = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        if (log.event_type === "line_login") acc.login += 1;
        if (log.event_type === "search") acc.search += 1;
        return acc;
      },
      { login: 0, search: 0 },
    );
  }, [logs]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Smart Klang Admin
            </p>
            <h1 className="text-2xl font-black">User Activity Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              {adminEmail || "กำลังตรวจสอบสิทธิ์เจ้าหน้าที่"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchLogs}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              รีเฟรช
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Login ผ่าน LINE
            </p>
            <p className="text-3xl font-black mt-2">{totals.login}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase">
              การค้นหา
            </p>
            <p className="text-3xl font-black mt-2">{totals.search}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Log ล่าสุด
            </p>
            <p className="text-3xl font-black mt-2">{logs.length}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black">ประวัติการใช้งานล่าสุด</h2>
            <span className="text-xs text-slate-400 font-bold">
              แสดงสูงสุด 200 รายการ
            </span>
          </div>

          {errorMessage && (
            <div className="m-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {errorMessage}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">ประเภท</th>
                  <th className="px-5 py-3">LINE ID</th>
                  <th className="px-5 py-3">ชื่อ LINE</th>
                  <th className="px-5 py-3">การค้นหา</th>
                  <th className="px-5 py-3">ปี</th>
                  <th className="px-5 py-3">วันที่ เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      ยังไม่มี log การใช้งาน
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            log.event_type === "line_login"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {log.event_type === "line_login" ? "LOGIN" : "SEARCH"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-700">
                        {log.line_user_id || "-"}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {log.line_display_name || "-"}
                      </td>
                      <td className="px-5 py-4">
                        {log.event_type === "search" ? (
                          <div>
                            <p className="font-bold">{log.search_query || "-"}</p>
                            <p className="text-xs text-slate-400">
                              {log.search_type || "-"}
                              {log.owner_id ? ` / owner: ${log.owner_id}` : ""}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">{log.search_year || "-"}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {formatThaiDateTime(log.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
