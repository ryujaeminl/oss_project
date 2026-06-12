// 기존 단일 HTML(code.html)의 상단 영역을 Next.js 기반으로 모듈화한 상단 헤더 컴포넌트입니다.
"use client";


import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/AppContext";
import { useRouter, usePathname } from "next/navigation";

interface HeaderProps {
  onOpenDrawer: () => void;
  onOpenMyPage: () => void;
  onLogout: () => void;
}

export default function Header({
  onOpenDrawer,
  onOpenMyPage,
  onLogout,
}: HeaderProps) {
  const { settings, notifications, setNotifications } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClearAllNotif = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications([]);
  };

  const handleNotifClick = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleTitleClick = () => {
    router.push("/planner");
  };

  return (
    <header className="h-14 bg-surface-container/60 dark:bg-surface-container/40 backdrop-blur-md flex items-center justify-between px-4 border-b border-surface-variant/20 shrink-0 select-none z-40">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenDrawer}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high/80 text-on-surface-variant transition-colors"
          title="메뉴"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>
        <h1
          onClick={handleTitleClick}
          className="font-headline font-bold text-xs text-primary cursor-pointer hover:opacity-80 transition-opacity"
        >
          Study Planner
        </h1>
      </div>

      <div className="flex items-center gap-2 relative">
        {/* Bell Notification Icon */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high/80 text-on-surface-variant transition-colors relative"
            title="알림"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border border-white dark:border-neutral-900 flex items-center justify-center text-[7px] text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Menu */}
          {isNotifOpen && (
            <div className="absolute right-0 top-11 w-64 bg-surface dark:bg-[#1a202c] border border-surface-variant/30 rounded-2xl shadow-xl py-3.5 z-[90] text-[10px] flex flex-col max-h-64 bubbly-shadow">
              <div className="px-3.5 pb-2 border-b border-surface-variant/20 flex justify-between items-center font-bold">
                <span className="text-primary text-[11px] tracking-wide">알림 센터</span>
                <button
                  onClick={handleClearAllNotif}
                  className="text-[9px] text-error hover:underline cursor-pointer"
                >
                  전체 삭제
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-2.5 py-1.5 space-y-1.5 mt-2">
                {notifications.length === 0 ? (
                  <div className="text-center text-on-surface-variant/50 py-6 italic select-none">
                    알림이 없습니다.
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isToday = n.text.includes("오늘");
                    const isLevelUp = n.text.includes("레벨");
                    const cleanText = n.text.replace("📢 ", "").replace("🎉 ", "");
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-2 items-start ${
                          n.read
                            ? "border-surface-variant/10 bg-surface-container-low/20 text-on-surface-variant/60"
                            : "border-primary/15 bg-primary/5 text-on-surface"
                        }`}
                      >
                        {/* Status Dot */}
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                          n.read
                            ? "bg-on-surface-variant/30"
                            : isLevelUp
                            ? "bg-amber-500"
                            : isToday
                            ? "bg-error animate-pulse"
                            : "bg-primary"
                        }`} />
                        <div className="flex-1 space-y-0.5 min-w-0">
                          <p className={`text-[10px] leading-snug break-all ${n.read ? "font-normal" : "font-semibold"}`}>
                            {cleanText}
                          </p>
                          <span className="text-[7px] text-on-surface-variant/40 block">
                            {n.date}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <span className="text-[10px] font-bold text-on-surface-variant/90 mr-1 select-none">
          {settings.username}
        </span>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 rounded-full overflow-hidden border border-primary-container shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
            title="프로필 메뉴"
          >
            <img
              className="w-full h-full object-cover"
              src={
                settings.activeMascot === "custom" && settings.customMascotUrl
                  ? settings.customMascotUrl
                  : settings.avatarUrl
              }
              alt="Profile Avatar"
            />
          </div>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-11 w-28 bg-surface dark:bg-inverse-surface border border-surface-variant/30 rounded-xl shadow-lg py-1.5 z-[90] text-[10px] font-bold">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileOpen(false);
                  onOpenMyPage();
                }}
                className="w-full text-left px-3 py-2 hover:bg-primary/10 text-on-surface transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
                <span>프로필 편집</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-2 hover:bg-error-container/20 text-error transition-colors flex items-center gap-1.5 border-t border-surface-variant/10"
              >
                <span className="material-symbols-outlined text-xs">logout</span>
                <span>로그아웃</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
