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
  const [timeStr, setTimeStr] = useState("02:20");

  const [isMobileMode, setIsMobileMode] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isCapNative = typeof window !== "undefined" && (window as any).Capacitor?.isNative;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobileMode(!!isCapNative || isSmallScreen);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    router.push("/mypage");
  };

  const showHeaderFooter = isLoggedIn && pathname !== "/";

  return (
    <div className="bg-surface overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container min-[700px]:bg-gradient-to-br min-[700px]:from-slate-900 min-[700px]:via-neutral-900 min-[700px]:to-slate-950 min-[700px]:min-h-screen min-[700px]:flex min-[700px]:items-center min-[700px]:justify-center min-[700px]:p-6">
      {/* Android Phone Frame Shell Wrapper */}
      <div className="w-full min-h-screen bg-surface flex flex-col relative pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] min-[700px]:w-auto min-[700px]:min-h-0 min-[700px]:min-w-0 min-[700px]:phone-container min-[700px]:max-w-[420px] min-[700px]:aspect-[9/19.5] min-[700px]:min-h-[840px] min-[700px]:bg-neutral-950 min-[700px]:rounded-[48px] min-[700px]:border-[4px] min-[700px]:border-neutral-800/80 min-[700px]:overflow-hidden min-[700px]:pt-0 min-[700px]:pb-0">
        
        {/* Top Camera Punch Hole Notch */}
        <div className="hidden min-[700px]:flex absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-[80] items-center justify-center pointer-events-none">
          <div className="w-3 h-3 bg-neutral-900 rounded-full border border-neutral-800/50 ml-auto mr-4"></div>
        </div>

        {/* Android Status Bar */}
        <div className="hidden min-[700px]:flex h-11 bg-[#6c5dd3]/10 dark:bg-black/20 items-center justify-between px-7 pt-2.5 z-50 text-white font-bold text-xs select-none pointer-events-none">
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
          <div className="hidden min-[700px]:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-600/40 rounded-full z-[80] pointer-events-none select-none"></div>
        </div>
      </div>


    </div>
  );
}
