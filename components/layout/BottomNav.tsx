// 기존 단일 HTML(code.html)의 탭 전환 방식을 Next.js의 라우팅 구조에 맞게 최적화한 하단 탭 네비게이션 컴포넌트입니다.
"use client";


import React from "react";
import { useRouter, usePathname } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { key: "planner", label: "플래너", icon: "timer", route: "/planner" },
    { key: "calendar", label: "달력", icon: "calendar_month", route: "/calendar" },
    { key: "notes", label: "노트", icon: "description", route: "/notes" },
    { key: "character", label: "캐릭터", icon: "smart_toy", route: "/character" },
  ];

  const handleTabClick = (route: string) => {
    router.push(route);
  };

  return (
    <nav className="h-15 bg-surface-container-lowest dark:bg-surface border-t border-surface-variant/30 flex items-center justify-around z-50 shadow-lg select-none shrink-0">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.route);
        return (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.route)}
            className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              isActive
                ? "text-primary font-bold"
                : "text-on-surface-variant/70 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
            <span className="text-[8px] font-bold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
