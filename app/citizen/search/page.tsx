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
        setShowSuggestions(false);
        return;
      }

      setIsSuggesting(true);
      try {
        const res = await fetch(`/api/suggest-owners?type=${searchType}&q=${encodeURIComponent(q)}`);
        const result = await res.json();
        console.log("DEBUG: Suggestions fetch result:", result);
        if (result.success) {
          setSuggestions(result.suggestions);
          setShowSuggestions(result.suggestions.length > 0);
          console.log("DEBUG: Setting showSuggestions to:", result.suggestions.length > 0);
        }
      } catch (err) {
        console.error("Suggest error:", err);
      } finally {
        setIsSuggesting(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 400);

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/10 to-blue-50/10 p-4 font-sans">
      <div className="relative w-full max-w-lg">
        {/* Card Container */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100/80">
          <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 transform hover:rotate-6 transition-all">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">ค้นหาข้อมูลภาษี</h1>
              <p className="text-slate-500 text-sm">ค้นหาข้อมูลทะเบียนทรัพย์สินจากฐานข้อมูลกองคลัง</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-8">
              {/* Type Switcher */}
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
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${searchType === "name" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
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
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${searchType === "idCard" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  ค้นหาจากเลขบัตร
                </button>
              </div>

              {/* Input Section */}
              <div className="space-y-6" ref={suggestionRef}>
                {searchType === "name" ? (
                  <div className="grid grid-cols-2 gap-4 relative">
                    <div className="col-span-2 md:col-span-1 relative">
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">ชื่อ</label>
                       <input
                         type="text"
                         required
                         value={firstName}
                         autoComplete="off"
                         onChange={(e) => {
                             setFirstName(e.target.value);
                             setSelectedOwnerId(null);
                         }}
                         className="text-black w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                         placeholder="กรอกชื่อ"
                       />
                       {/* Dropdown Suggestions for Name */}
                       {showSuggestions && searchType === "name" && (
                         <div className="absolute top-full left-0 w-full z-[999] mt-3 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 divide-y max-h-60 overflow-y-auto ring-1 ring-black/5">
                            {suggestions.map((s) => (
                              <button
                                key={s.owner_id}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                                className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-all flex flex-col gap-0.5 active:bg-slate-100"
                              >
                                <span className="font-black text-slate-800 text-sm tracking-tight">{s.fname} {s.lname}</span>
                                <span className="text-[10px] text-indigo-500 font-mono italic">ID: {s.id_card || "ไม่ระบุ"}</span>
                              </button>
                            ))}
                         </div>
                       )}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">นามสกุล</label>
                       <input
                         type="text"
                         value={lastName}
                         autoComplete="off"
                         onChange={(e) => {
                             setLastName(e.target.value);
                             setSelectedOwnerId(null);
                         }}
                         className="text-black w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                         placeholder="ถ้ามี"
                       />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">เลขประจำตัวประชาชน 13 หลัก</label>
                    <input
                      type="text"
                      maxLength={13}
                      required
                      value={idCard}
                      autoComplete="off"
                      onChange={(e) => {
                          setIdCard(e.target.value.replace(/\D/g, ""));
                          setSelectedOwnerId(null);
                      }}
                      className="text-black w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono tracking-widest focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      placeholder="0000000000000"
                    />
                    {/* Dropdown Suggestions for ID Card */}
                    {showSuggestions && searchType === "idCard" && (
                      <div className="absolute top-full left-0 w-full z-[999] mt-3 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 divide-y max-h-60 overflow-y-auto ring-1 ring-black/5">
                         {suggestions.map((s) => (
                           <button
                             key={s.owner_id}
                             type="button"
                             onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                             className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-all flex flex-col gap-0.5 active:bg-slate-100"
                           >
                             <span className="font-black text-slate-800 text-sm tracking-tight">{s.fname} {s.lname}</span>
                             <span className="text-[10px] text-indigo-500 font-mono tracking-wider italic">{s.id_card}</span>
                           </button>
                         ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Year Selection */}
                <div className="pt-2">
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !selectedAnnual}
                className="w-full py-5 rounded-[1.5rem] text-white font-black text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-indigo-100 transition-all disabled:opacity-50 disabled:scale-100"
              >
                ค้นหาข้อมูลจากคลัง
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-sans tracking-wide">กำลังเข้าสู่ระบบ...</div>}>
      <SearchContent />
    </Suspense>
  );
}
