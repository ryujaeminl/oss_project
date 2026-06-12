// 기존 단일 HTML(code.html)의 글로벌 상태 관리를 Next.js 구조에 최적화하여 Provider 형태로 바인딩하는 컴포넌트입니다.
"use client";


import { AppProvider } from "@/lib/AppContext";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </SessionProvider>
  );
}
