// 기존 단일 HTML(code.html)을 Next.js 프레임워크 기반으로 변환하여 구현한 로그인 및 자체 회원가입, 소셜 간편 로그인 데모 화면입니다.
"use client";


import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface UserRecord {
  email: string;
  username: string;
  password?: string;
  goalHours: string;
  avatarUrl: string;
}

export default function LoginPage() {
  const { isLoggedIn, setIsLoggedIn, updateSettings } = useApp();
  const router = useRouter();

  const [formMode, setFormMode] = useState<"login" | "register">("login");
  const [userDb, setUserDb] = useState<UserRecord[]>([]);

  // Local login inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Local signup inputs
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regGoalHours, setRegGoalHours] = useState("");

  // Social login loader state
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialLoadingText, setSocialLoadingText] = useState("");

  // Read users database on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDb = localStorage.getItem("sp_user_db");
      if (storedDb) {
        setUserDb(JSON.parse(storedDb));
      }
    }
  }, []);

  const handleLocalLoginSubmit = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim(),
        password: loginPassword.trim(),
        redirect: false,
      });

      if (result?.error) {
        alert(result.error);
        return;
      }

      setIsLoggedIn(true);
      router.push("/planner");
    } catch (err) {
      console.error(err);
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  const handleLocalRegisterSubmit = async () => {
    if (!regEmail.trim() || !regUsername.trim() || !regPassword.trim()) {
      alert("이메일, 이름, 비밀번호는 필수 입력 사항입니다.");
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    const parseGoalHoursToMinutes = (str: string): number => {
      let h = 0, m = 0;
      const hMatch = str.match(/(\d+)\s*시간/);
      const mMatch = str.match(/(\d+)\s*분/);
      if (hMatch) h = parseInt(hMatch[1]);
      if (mMatch) m = parseInt(mMatch[1]);
      if (h === 0 && m === 0) {
        const num = parseInt(str);
        if (!isNaN(num)) return num;
        return 270; // 4h 30m default
      }
      return h * 60 + m;
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail.trim(),
          name: regUsername.trim(),
          password: regPassword.trim(),
          goalTime: parseGoalHoursToMinutes(regGoalHours.trim() || "4시간 30분"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "회원가입에 실패했습니다.");
        return;
      }

      alert("회원가입이 완료되었습니다. 방금 생성하신 이메일과 비밀번호로 로그인해주세요.");

      // Reset inputs
      setRegEmail("");
      setRegUsername("");
      setRegPassword("");
      setRegPasswordConfirm("");
      setRegGoalHours("");

      setFormMode("login");
    } catch (err) {
      console.error(err);
      alert("네트워크 오류로 회원가입에 실패했습니다.");
    }
  };

  const handleSocialLogin = async (provider: "kakao" | "naver" | "google") => {
    try {
      const providersRes = await fetch("/api/auth/providers");
      const providers = await providersRes.json();
      
      if (providers && providers[provider]) {
        // Real provider is configured in NextAuth!
        signIn(provider, { callbackUrl: "/planner" });
      } else {
        // Real provider not configured -> Fallback to mock simulation
        setSocialLoading(true);
        setSocialLoadingText(`${provider === "google" ? "Google" : provider === "naver" ? "Naver" : "Kakao"} 계정으로 간편 로그인 연동 중...`);
        
        const mockEmail = `mock_${provider}@studyplanner.com`;
        const mockName = `${provider === "google" ? "구글" : provider === "naver" ? "네이버" : "카카오"} 사용자`;
        
        // 1. Call register endpoint to ensure user exists
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: mockEmail,
            name: mockName,
            password: "mock_social_password_123",
            goalTime: 270,
          }),
        });

        // 2. Perform credentials login
        const result = await signIn("credentials", {
          email: mockEmail,
          password: "mock_social_password_123",
          redirect: false,
        });

        setSocialLoading(false);
        if (result?.error) {
          alert(result.error);
        } else {
          setIsLoggedIn(true);
          router.push("/planner");
        }
      }
    } catch (e) {
      console.error("Social login error:", e);
      signIn(provider, { callbackUrl: "/planner" }); // fallback attempt
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 top-0 bg-surface dark:bg-inverse-surface z-[70] flex flex-col p-6 overflow-y-auto no-scrollbar">
      {/* Social Loading Spinner simulation */}
      {socialLoading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[95] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-white">{socialLoadingText}</p>
        </div>
      )}

      <div className="my-auto space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto text-primary">
            <span className="material-symbols-outlined text-3xl">edit_calendar</span>
          </div>
          <h2 className="font-headline font-bold text-xl text-primary">Study Planner</h2>
          <p className="text-[10px] text-on-surface-variant">나만의 모바일 스마트 플래너</p>
        </div>

        {/* Local Login Card */}
        {formMode === "login" ? (
          <div className="bg-surface-container rounded-3xl p-5 border border-surface-variant/20 space-y-3.5 shadow-md">
            <div className="flex justify-between items-center pb-2 border-b border-surface-variant/20">
              <span className="text-xs font-bold text-primary">로그인</span>
              <button
                onClick={() => setFormMode("register")}
                className="text-[10px] text-on-surface-variant hover:underline cursor-pointer"
              >
                회원가입하기
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                이메일 주소 (ID)
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-on-surface"
              />
            </div>
            <button
              onClick={handleLocalLoginSubmit}
              className="w-full py-2.5 rounded-full bg-primary bubbly-button text-white font-bold text-xs transition-all cursor-pointer"
            >
              로그인
            </button>
          </div>
        ) : (
          /* Local Signup Card */
          <div className="bg-surface-container rounded-3xl p-5 border border-surface-variant/20 space-y-3 shadow-md">
            <div className="flex justify-between items-center pb-2 border-b border-surface-variant/20">
              <span className="text-xs font-bold text-primary">자체 회원가입</span>
              <button
                onClick={() => setFormMode("login")}
                className="text-[10px] text-on-surface-variant hover:underline cursor-pointer"
              >
                로그인하러 가기
              </button>
            </div>
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              <div>
                <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">
                  이메일 주소 (ID)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">
                  사용자 이름
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="이름 (예: 소영)"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">
                  하루 목표 시간
                </label>
                <input
                  type="text"
                  value={regGoalHours}
                  onChange={(e) => setRegGoalHours(e.target.value)}
                  placeholder="예: 4시간 30분"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
            </div>
            <button
              onClick={handleLocalRegisterSubmit}
              className="w-full py-2.5 rounded-full bg-primary bubbly-button text-white font-bold text-xs transition-all mt-2 cursor-pointer"
            >
              회원가입 완료
            </button>
          </div>
        )}

        {/* Social login simulation options */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-center gap-2">
            <span className="h-px bg-surface-variant/40 flex-1"></span>
            <span className="text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
              소셜 간편 로그인
            </span>
            <span className="h-px bg-surface-variant/40 flex-1"></span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => handleSocialLogin("kakao")}
              className="w-full py-2 bg-[#FEE500] text-[#191919] font-bold text-[10px] rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">chat_bubble</span>
              <span>카카오톡으로 로그인</span>
            </button>
            <button
              onClick={() => handleSocialLogin("naver")}
              className="w-full py-2 bg-[#03C75A] text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">check_box</span>
              <span>네이버로 로그인</span>
            </button>
            <button
              onClick={() => handleSocialLogin("google")}
              className="w-full py-2 bg-white border border-outline-variant/60 text-on-surface-variant font-bold text-[10px] rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">mail</span>
              <span>구글 계정으로 로그인</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
