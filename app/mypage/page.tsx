"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const {
    settings,
    updateSettings,
    updateUserProfile,
    isLoggedIn,
    setIsLoggedIn,
    mascotLevel,
    mascotXP,
    tasks,
    calendarNotes,
    calendarMoods,
    timetableDrawings,
    concepts,
    wrongAnswers,
    setTasks,
    setCalendarNotes,
    setCalendarMoods,
    setTimetableDrawings,
    setConcepts,
    setWrongAnswers,
  } = useApp();

  // Input states
  const [usernameInput, setUsernameInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form fields
  useEffect(() => {
    if (settings) {
      setUsernameInput(settings.username || "");
      setGoalInput(settings.goalHours || "");
      setApiKeyInput(settings.geminiApiKey || "");
    }
  }, [settings]);

  // Determine Login Provider & Email
  const userEmail = session?.user?.email || (isLoggedIn ? "local_user@studyplanner.com" : "guest_user@studyplanner.com");
  const loginProvider = (() => {
    if (userEmail.includes("google")) return "Google 간편 로그인";
    if (userEmail.includes("naver")) return "Naver 간편 로그인";
    if (userEmail.includes("kakao")) return "Kakao 간편 로그인";
    if (isLoggedIn) return "자체 이메일 로그인";
    return "게스트 계정";
  })();

  const handleProfileSave = async () => {
    if (!usernameInput.trim()) {
      alert("사용자 이름을 입력해주세요.");
      return;
    }

    setIsSaving(true);

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

    const goalTimeMinutes = parseGoalTimeToMinutes(goalInput);

    try {
      await updateUserProfile(usernameInput.trim(), goalTimeMinutes, undefined, apiKeyInput.trim());
      alert("프로필 정보가 저장되었습니다! ✨");
    } catch (e) {
      console.error(e);
      alert("프로필 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => {
      setIsLoggedIn(false);
      router.push("/");
    });
  };

  const handleExportData = () => {
    try {
      const exportData = {
        settings,
        tasks,
        calendarNotes,
        calendarMoods,
        timetableDrawings,
        concepts,
        wrongAnswers,
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `study_planner_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert("데이터를 파일로 내보냈습니다! 💾");
    } catch (e) {
      console.error(e);
      alert("데이터 내보내기에 실패했습니다.");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings) updateSettings(data.settings);
        if (data.tasks) setTasks(data.tasks);
        if (data.calendarNotes) setCalendarNotes(data.calendarNotes);
        if (data.calendarMoods) setCalendarMoods(data.calendarMoods);
        if (data.timetableDrawings) setTimetableDrawings(data.timetableDrawings);
        if (data.concepts) setConcepts(data.concepts);
        if (data.wrongAnswers) setWrongAnswers(data.wrongAnswers);
        
        alert("데이터를 성공적으로 가져왔습니다! 📂");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("올바르지 않은 백업 파일 형식이거나 파일 해석에 실패했습니다.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 bg-surface-container-lowest dark:bg-surface overflow-y-auto no-scrollbar pb-24">
      {/* Header with Back button */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.push("/planner")}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
        </button>
        <h2 className="font-headline font-bold text-sm text-primary">마이페이지</h2>
      </div>

      {/* 1. Profile Hero Card */}
      <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden bubbly-shadow">
        <div className="w-18 h-18 rounded-full border-2 border-primary overflow-hidden shrink-0 shadow-md">
          <img
            src={
              settings.activeMascot === "custom" && settings.customMascotUrl
                ? settings.customMascotUrl
                : settings.avatarUrl
            }
            className="w-full h-full object-cover"
            alt="Mascot Avatar"
          />
        </div>
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-on-surface truncate">{settings.username}</h3>
            <span className="text-[8px] bg-primary/20 text-primary font-black px-2 py-0.5 rounded-full whitespace-nowrap">
              Lv.{mascotLevel}
            </span>
          </div>
          <p className="text-[10px] text-on-surface-variant/80">목표 시간: {settings.goalHours}</p>
          {/* XP Progress Bar */}
          <div className="w-40 space-y-1">
            <div className="flex justify-between text-[7px] text-on-surface-variant/60 font-bold">
              <span>XP 성장도</span>
              <span>{mascotXP} / 1000 XP</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (mascotXP / 1000) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Login & Account Details */}
      <div className="bg-white dark:bg-[#1a202c] border border-surface-variant/20 rounded-3xl p-4.5 space-y-3 bubbly-shadow text-xs">
        <h4 className="font-bold text-primary flex items-center gap-1.5 pb-2 border-b border-surface-variant/10 text-[11px]">
          <span className="material-symbols-outlined text-sm">vpn_key</span>
          <span>로그인 계정 정보</span>
        </h4>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-on-surface-variant">연동 플랫폼</span>
            <span className="font-semibold text-on-surface bg-surface-container-high px-2 py-0.5 rounded-lg border border-outline-variant/30">
              {loginProvider}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-on-surface-variant">이메일 주소</span>
            <span className="font-semibold text-on-surface truncate max-w-[180px]">{userEmail}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-on-surface-variant">계정 연동 상태</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>정상 연동됨</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Edit Profile Form */}
      <div className="bg-white dark:bg-[#1a202c] border border-surface-variant/20 rounded-3xl p-4.5 space-y-4.5 bubbly-shadow text-xs">
        <h4 className="font-bold text-primary flex items-center gap-1.5 pb-2 border-b border-surface-variant/10 text-[11px]">
          <span className="material-symbols-outlined text-sm">settings_accessibility</span>
          <span>프로필 설정 수정</span>
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block font-bold text-on-surface-variant mb-1 text-[10px]">사용자 이름</label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="이름 입력"
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-xs text-on-surface"
            />
          </div>
          <div>
            <label className="block font-bold text-on-surface-variant mb-1 text-[10px]">하루 목표 시간</label>
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="예: 4시간 30분"
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-xs text-on-surface"
            />
          </div>
          <div>
            <label className="block font-bold text-on-surface-variant mb-1 text-[10px]">Gemini AI API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AI API Key 입력 (공백 시 기본 키 사용)"
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl pl-3 pr-10 py-2 focus:outline-none focus:border-primary text-xs text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary"
              >
                <span className="material-symbols-outlined text-base">
                  {showApiKey ? "visibility" : "visibility_off"}
                </span>
              </button>
            </div>
          </div>
          <button
            onClick={handleProfileSave}
            disabled={isSaving}
            className="w-full py-2.5 rounded-full bg-primary bubbly-button font-bold text-white text-center transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "프로필 저장 중..." : "프로필 저장 완료"}
          </button>
        </div>
      </div>

      {/* 4. Planner Decoration Settings Accordion Style */}
      <div className="bg-white dark:bg-[#1a202c] border border-surface-variant/20 rounded-3xl p-4.5 space-y-3.5 bubbly-shadow text-xs">
        <h4 className="font-bold text-primary flex items-center gap-1.5 pb-2 border-b border-surface-variant/10 text-[11px]">
          <span className="material-symbols-outlined text-sm">palette</span>
          <span>플래너 테마 및 알림 설정</span>
        </h4>
        
        {/* Colors Selection */}
        <div className="space-y-1.5">
          <label className="block font-bold text-on-surface-variant text-[10px]">
            어플리케이션 테마 색상
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: "mint", label: "Cozy Mint", style: "bg-[#356761]/10 text-[#356761] border-[#356761]/30" },
              { key: "lavender", label: "Lavender", style: "bg-[#655978]/10 text-[#655978] border-[#655978]/30" },
              { key: "yellow", label: "Yellow", style: "bg-[#665f34]/10 text-[#665f34] border-[#665f34]/30" },
              { key: "blue", label: "Sky Blue", style: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
              { key: "pink", label: "Soft Pink", style: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
              { key: "green", label: "Forest Green", style: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
            ].map((theme) => (
              <button
                key={theme.key}
                onClick={() => updateSettings({ themeColor: theme.key as any })}
                className={`py-1.5 rounded-lg border text-[9px] font-bold hover:brightness-95 transition-all text-center cursor-pointer ${theme.style} ${
                  settings.themeColor === theme.key ? "ring-2 ring-primary" : ""
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 pt-2 border-t border-surface-variant/10">
          {/* Dark Mode */}
          <div className="flex items-center justify-between py-1">
            <span className="font-bold text-on-surface-variant text-[10px]">다크 모드</span>
            <label className="relative inline-flex items-center cursor-pointer scale-90">
              <input
                type="checkbox"
                checked={settings.bgMode === "dark"}
                onChange={(e) =>
                  updateSettings({ bgMode: e.target.checked ? "dark" : "light" })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Sound Notification */}
          <div className="flex items-center justify-between py-1 border-t border-surface-variant/10 pt-2">
            <span className="font-bold text-on-surface-variant text-[10px]">알림 효과음</span>
            <label className="relative inline-flex items-center cursor-pointer scale-90">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Corner Roundness */}
          <div className="flex items-center justify-between py-1 border-t border-surface-variant/10 pt-2">
            <span className="font-bold text-on-surface-variant text-[10px]">카드 모서리 둥글게</span>
            <label className="relative inline-flex items-center cursor-pointer scale-90">
              <input
                type="checkbox"
                checked={settings.cardRoundness === "standard"}
                onChange={(e) =>
                  updateSettings({
                    cardRoundness: e.target.checked ? "standard" : "sharp",
                  })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Deadline D-day */}
          <div className="flex items-center justify-between py-1 border-t border-surface-variant/10 pt-2">
            <span className="font-bold text-on-surface-variant text-[10px]">마감일 D-Day 알림</span>
            <label className="relative inline-flex items-center cursor-pointer scale-90">
              <input
                type="checkbox"
                checked={settings.deadlineAlertsEnabled}
                onChange={(e) =>
                  updateSettings({ deadlineAlertsEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 5. Backup & Restore Data */}
      <div className="bg-white dark:bg-[#1a202c] border border-surface-variant/20 rounded-3xl p-4.5 space-y-3.5 bubbly-shadow text-xs">
        <h4 className="font-bold text-primary flex items-center gap-1.5 pb-2 border-b border-surface-variant/10 text-[11px]">
          <span className="material-symbols-outlined text-sm">cloud_sync</span>
          <span>학습 데이터 백업 및 복원</span>
        </h4>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleExportData}
            className="w-full py-2.5 rounded-xl border border-[#d8e7d1]/80 hover:bg-primary/10 text-[#3f6b31] font-bold text-center transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white"
          >
            <span className="material-symbols-outlined text-base">upload</span>
            <span>학습계획 내보내기 (JSON 백업)</span>
          </button>
          <label className="w-full py-2.5 rounded-xl border border-[#d8e7d1]/80 hover:bg-primary/10 text-[#3f6b31] font-bold text-center transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
            <span className="material-symbols-outlined text-base">download</span>
            <span>학습계획 가져오기 (JSON 복원)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 6. Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-3xl bg-error/10 hover:bg-error/15 text-error font-bold text-xs flex items-center justify-center gap-2 border border-error/20 active:scale-[0.98] transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-base font-bold">logout</span>
        <span>학습계획 종료 및 로그아웃</span>
      </button>
    </div>
  );
}
