// 기존 단일 HTML(code.html)의 HTML 메타 구조를 Next.js App Router용 root Layout 구성으로 전환한 파일입니다.
import type { Metadata } from "next";


import Providers from "@/components/Providers";
import PhoneShell from "@/components/layout/PhoneShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Woolini - 안드로이드 플래너",
  description: "나만의 모바일 스터디 플래너",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="light" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body>
        <Providers>
          <PhoneShell>{children}</PhoneShell>
        </Providers>
      </body>
    </html>
  );
}
