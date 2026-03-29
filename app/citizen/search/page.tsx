"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface OwnerSuggestion {
  owner_id: string;
  fname: string;
  lname: string;
  id_card: string;
}

function SearchContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State สำหรับค้นหา
  const [searchType, setSearchType] = useState<"idCard" | "name">("name");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idCard, setIdCard] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<OwnerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Year state
  const [annualOptions, setAnnualOptions] = useState<string[]>([]);
  const [selectedAnnual, setSelectedAnnual] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load Year Options
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    async function fetchAnnuals() {
      try {
        const { data, error } = await supabase.from("pa").select("annual");
        if (!error && data) {
          const uniqueAnnuals = Array.from(
            new Set(
              data
                .filter((item) => item && item.annual)
                .map((item) => String(item.annual).trim())
                .filter((item) => item !== ""),
            ),
          ).sort((a, b) => Number(b) - Number(a));

          setAnnualOptions(uniqueAnnuals);
          if (uniqueAnnuals.length > 0) setSelectedAnnual(uniqueAnnuals[0]);
        }
      } catch (err) {
        console.error("Error fetching annuals:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnnuals();
  }, [status, router]);

  // Handle Autocomplete Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      const q = searchType === "name" ? firstName : idCard;
      if (q.length < 1 || selectedOwnerId) {
        setSuggestions([]);
        return;
      }

      setIsSuggesting(true);
      try {
        const res = await fetch(`/api/suggest-owners?type=${searchType}&q=${encodeURIComponent(q)}`);
        const result = await res.json();
        if (result.success) {
          setSuggestions(result.suggestions);
          setShowSuggestions(result.suggestions.length > 0);
        }
      } catch (err) {
        console.error("Suggest error:", err);
      } finally {
        setIsSuggesting(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [firstName, idCard, searchType, selectedOwnerId]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: OwnerSuggestion) => {
    if (searchType === "name") {
      setFirstName(suggestion.fname);
      setLastName(suggestion.lname || "");
    } else {
      setIdCard(suggestion.id_card || "");
    }
    setSelectedOwnerId(suggestion.owner_id);
    setShowSuggestions(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnual) return;

    let queryParams = new URLSearchParams();
    queryParams.set("year", selectedAnnual);

    if (selectedOwnerId) {
      queryParams.set("ownerId", selectedOwnerId);
    } else {
      if (searchType === "idCard") {
        if (!idCard) {
            alert("กรุณากรอกเลขประจำตัวประชาชน");
            return;
        }
        queryParams.set("idCard", idCard);
      } else {
        if (!firstName) {
          alert("กรุณากรอกชื่อ");
          return;
        }
        queryParams.set("firstName", firstName);
        if (lastName) queryParams.set("lastName", lastName);
      }
    }

    router.push(`/citizen/search-selection?${queryParams.toString()}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/20 p-4 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative w-full max-w-lg">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">ค้นหาข้อมูลภาษี</h1>
              <p className="text-slate-500 text-sm">ระบุชื่อหรือเลขบัตร ข้อมูลจะดึงมาจากฐานข้อมูลกองคลังโดยตรง</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-8">
              <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full">
                <button
                  type="button"
                  onClick={() => {
                      setSearchType("name");
                      setSelectedOwnerId(null);
                      setFirstName("");
                      setLastName("");
                      setIdCard("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${searchType === "name" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  ค้นหาจากชื่อ
                </button>
                <button
                  type="button"
                  onClick={() => {
                      setSearchType("idCard");
                      setSelectedOwnerId(null);
                      setFirstName("");
                      setLastName("");
                      setIdCard("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${searchType === "idCard" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  ค้นหาจากเลขบัตร
                </button>
              </div>

              <div className="space-y-5 relative" ref={suggestionRef}>
                {searchType === "name" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">ชื่อ</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => {
                            setFirstName(e.target.value);
                            setSelectedOwnerId(null);
                        }}
                        className="text-black w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                        placeholder="กรอกชื่อ"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">นามสกุล</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                            setLastName(e.target.value);
                            setSelectedOwnerId(null);
                        }}
                        className="text-black w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                        placeholder="ถ้ามี"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">เลขประจำตัวประชาชน 13 หลัก</label>
                    <input
                      type="text"
                      maxLength={13}
                      required
                      value={idCard}
                      onChange={(e) => {
                          setIdCard(e.target.value.replace(/\D/g, ""));
                          setSelectedOwnerId(null);
                      }}
                      className="text-black w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono tracking-[0.2em] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                      placeholder="0000000000000"
                    />
                  </div>
                )}

                {/* Suggestions List */}
                {showSuggestions && (
                  <div className="absolute top-[75px] left-0 w-full z-[100] bg-white rounded-2xl shadow-2xl border border-slate-200 divide-y divide-slate-50 max-h-64 overflow-y-auto overflow-x-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s.owner_id}
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault(); // ป้องกันการ Blur ก่อนคลิกสำเร็จ
                            handleSelectSuggestion(s);
                        }}
                        className="w-full text-left px-5 py-4 hover:bg-indigo-50/50 transition-all flex flex-col gap-1 active:bg-indigo-100"
                      >
                        <span className="font-bold text-slate-800 text-base">{s.fname} {s.lname}</span>
                        {s.id_card && (
                          <div className="flex items-center gap-2 text-indigo-500">
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm5 3h1a1 1 0 110 2h-1a1 1 0 110-2zm-4 0H5a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1z"></path>
                             </svg>
                             <span className="text-xs font-mono font-semibold tracking-wider">{s.id_card}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">เลือกปีประเมินภาษี</label>
                  <div className="relative">
                    <select
                      value={selectedAnnual}
                      onChange={(e) => setSelectedAnnual(e.target.value)}
                      disabled={isLoading}
                      className="text-black w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                    >
                      {isLoading ? <option>กำลังโหลดปี...</option> : annualOptions.map((year) => <option key={year} value={year}>ปี พ.ศ. {year}</option>)}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedAnnual}
                className="w-full py-5 rounded-[1.5rem] text-white font-black text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-indigo-200 transition-all disabled:opacity-50 disabled:scale-100"
              >
                ค้นหาข้อมูลจากคลัง
              </button>
            </form>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 font-medium mt-10 tracking-widest uppercase opacity-70">Smart Klang • Digital Tax Service</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
