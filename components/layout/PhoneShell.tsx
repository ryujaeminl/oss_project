// 기존 단일 HTML(code.html)의 안드로이드 폰 프레임 디자인 및 글로벌 레이아웃을 Next.js용 Phone Shell 컴포넌트로 독립화한 파일입니다.
"use client";


import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import Header from "./Header";
import BottomNav from "./BottomNav";
import NavDrawer from "./NavDrawer";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function PhoneShell({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, setIsLoggedIn, settings, updateSettings, updateUserProfile } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("02:20");

  // Edit MyPage fields state
  const [editUsername, setEditUsername] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editApiKey, setEditApiKey] = useState("");

  // Update android status bar clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setTimeStr(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  // Redirect logic based on login state
  useEffect(() => {
    if (!isLoggedIn && pathname !== "/") {
      router.push("/");
    } else if (isLoggedIn && pathname === "/") {
      router.push("/planner");
    }
  }, [isLoggedIn, pathname, router]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => {
      setIsLoggedIn(false);
      router.push("/");
    });
  };

  const handleOpenMyPage = () => {
    setEditUsername(settings.username);
    setEditGoal(settings.goalHours);
    setEditApiKey(settings.geminiApiKey || "");
    setIsMyPageOpen(true);
  };

  const handleSaveMyPage = () => {
    if (!editUsername.trim()) {
      alert("사용자 이름을 입력해주세요.");
      return;
    }
    
    // Parse editGoal (e.g. "4시간 30분") to minutes
    const parseGoalTimeToMinutes = (str: string): number => {
      const hourMatch = str.match(/(\d+)\s*시간/);
      const minMatch = str.match(/(\d+)\s*분/);
      let totalMinutes = 0;
      if (hourMatch) {
        totalMinutes += parseInt(hourMatch[1]) * 60;
      }
      if (minMatch) {
        totalMinutes += parseInt(minMatch[1]);
      }
      if (totalMinutes === 0) {
        const directNumber = parseInt(str);
        if (!isNaN(directNumber)) {
          if (directNumber < 24) {
            totalMinutes = directNumber * 60;
          } else {
            totalMinutes = directNumber;
          }
        }
      }
      return totalMinutes || 120; // fallback to 2 hours
    };

    const goalTimeMinutes = parseGoalTimeToMinutes(editGoal);
    updateUserProfile(editUsername, goalTimeMinutes, undefined, editApiKey);
    setIsMyPageOpen(false);
  };

  const showHeaderFooter = isLoggedIn && pathname !== "/";

  return (
    <div className="bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-950 min-h-screen flex items-center justify-center p-0 md:p-6 overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Android Phone Frame Shell Wrapper */}
      <div className="phone-container w-full max-w-[420px] aspect-[9/19.5] min-h-[720px] md:min-h-[840px] bg-neutral-950 rounded-[48px] overflow-hidden relative flex flex-col border-[4px] border-neutral-800/80">
        
        {/* Top Camera Punch Hole Notch */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-[80] flex items-center justify-center pointer-events-none">
          <div className="w-3 h-3 bg-neutral-900 rounded-full border border-neutral-800/50 ml-auto mr-4"></div>
        </div>

        {/* Android Status Bar */}
        <div className="h-11 bg-[#6c5dd3]/10 dark:bg-black/20 flex items-center justify-between px-7 pt-2.5 z-50 text-white font-bold text-xs select-none pointer-events-none">
          <span>{timeStr}</span>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm font-bold">wifi</span>
            <span className="material-symbols-outlined text-sm font-bold">signal_cellular_4_bar</span>
            <span className="material-symbols-outlined text-sm font-bold">battery_full</span>
          </div>
        </div>

        {/* App Screen Inside Shell */}
        <div
          className="flex-1 bg-surface dark:bg-inverse-surface text-on-surface dark:text-inverse-on-surface overflow-y-auto no-scrollbar flex flex-col relative"
          id="app-screen"
        >
          {/* Header */}
          {showHeaderFooter && (
            <Header
              onOpenDrawer={() => setIsDrawerOpen(true)}
              onOpenMyPage={handleOpenMyPage}
              onLogout={handleLogout}
            />
          )}

          {/* NavDrawer Component */}
          <NavDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onOpenMyPage={handleOpenMyPage}
            onLogout={handleLogout}
          />

          {/* Main Contents */}
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative">
            {children}
          </div>

          {/* Footer Bottom Nav */}
          {showHeaderFooter && <BottomNav />}

          {/* Bottom Navigation Gesture Bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-600/40 rounded-full z-[80] pointer-events-none select-none"></div>
        </div>
      </div>

      {/* MYPAGE EDIT MODAL DIALOG */}
      {isMyPageOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface dark:bg-[#1a202c] rounded-3xl max-w-[340px] w-full p-5 bubbly-shadow border border-surface-variant/20 scale-100 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-headline font-bold text-base text-primary">마이페이지 편집</h3>
                <p className="text-[10px] text-on-surface-variant/80 mt-0.5">내 프로필 정보를 수정합니다.</p>
              </div>
              <button
                className="p-1 rounded-full hover:bg-surface-container-high"
                onClick={() => setIsMyPageOpen(false)}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">사용자 이름</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="이름 입력"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">하루 목표 시간</label>
                <input
                  type="text"
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  placeholder="예: 4시간 30분"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Gemini AI API Key</label>
                <input
                  type="password"
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  placeholder="AI API Key 입력 (공백 시 기본 키 사용)"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setIsMyPageOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-surface-container-highest hover:bg-surface-dim font-bold text-on-surface-variant text-center transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMyPage}
                  className="flex-[2] py-2.5 rounded-full bg-primary bubbly-button font-bold text-white text-center transition-all cursor-pointer"
                >
                  저장 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
