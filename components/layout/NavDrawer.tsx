// 기존 단일 HTML(code.html)의 마이페이지/테마 설정 및 데이터 백업/복원 기능을 Next.js 컴포넌트로 리팩토링한 사이드 네비게이션 드로어 컴포넌트입니다.
"use client";


import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { useRouter } from "next/navigation";

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMyPage: () => void;
  onLogout: () => void;
}

export default function NavDrawer({
  isOpen,
  onClose,
  onOpenMyPage,
  onLogout,
}: NavDrawerProps) {
  const router = useRouter();
  const { settings, updateSettings, tasks, calendarNotes, calendarMoods, timetableDrawings, concepts, wrongAnswers, setConcepts, setWrongAnswers, setTasks, setCalendarNotes, setCalendarMoods, setTimetableDrawings } = useApp();
  const [isDecorOpen, setIsDecorOpen] = useState(false);

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
        onClose();
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("올바르지 않은 백업 파일 형식이거나 파일 해석에 실패했습니다.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-[80] backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Navigation Drawer Panel */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-[260px] bg-surface dark:bg-inverse-surface z-[85] shadow-2xl transition-transform duration-300 flex flex-col overflow-y-auto no-scrollbar border-r border-surface-variant/20 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* User Profile Header */}
        <div className="bg-primary/10 p-5 border-b border-surface-variant/20 flex flex-col gap-3 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-surface-container-high/80 text-on-surface-variant hover:text-error transition-all"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary bubbly-shadow">
            <img
              className="w-full h-full object-cover"
              src={
                settings.activeMascot === "custom" && settings.customMascotUrl
                  ? settings.customMascotUrl
                  : settings.avatarUrl
              }
              alt="Mascot Avatar"
            />
          </div>
          <div>
            <h4 className="text-xs font-bold text-on-surface">
              {settings.username}
            </h4>
            <p className="text-[9px] text-on-surface-variant/70 mt-0.5">
              하루 목표: {settings.goalHours}
            </p>
          </div>
        </div>

        {/* Drawer Items */}
        <div className="flex-1 p-3 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenMyPage();
            }}
            className="w-full px-4 py-3 rounded-xl hover:bg-primary/10 flex items-center gap-3 text-xs font-bold text-on-surface transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg text-primary">
              account_circle
            </span>
            <span>내 마이페이지</span>
          </button>

          {/* Decorate Accordion Button */}
          <button
            onClick={() => setIsDecorOpen(!isDecorOpen)}
            className="w-full px-4 py-3 rounded-xl hover:bg-primary/10 flex items-center justify-between text-xs font-bold text-on-surface transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lg text-primary">
                palette
              </span>
              <span>플래너 꾸미기 설정</span>
            </div>
            <span
              className={`material-symbols-outlined text-sm transition-transform duration-300 ${
                isDecorOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>

          {/* Decorate Content Panel */}
          {isDecorOpen && (
            <div className="pl-6 pr-2 py-2 space-y-3.5 border-l-2 border-primary/20 ml-6 text-[10px]">
              {/* Themes Palette */}
              <div className="space-y-1.5">
                <label className="block font-bold text-on-surface-variant">
                  어플리케이션 테마 색상
                </label>
                <div className="grid grid-cols-3 gap-1">
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
                      className={`py-1.5 rounded-lg border text-[9px] font-bold hover:brightness-95 transition-all ${theme.style} ${
                        settings.themeColor === theme.key ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DarkMode Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-surface-variant/10 pt-2">
                <span className="font-bold text-on-surface-variant">다크 모드</span>
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

              {/* Sound Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-surface-variant/10 pt-2">
                <span className="font-bold text-on-surface-variant">알림 효과음</span>
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

              {/* Roundness Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-surface-variant/10 pt-2">
                <span className="font-bold text-on-surface-variant">
                  카드 모서리 둥글게
                </span>
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

              {/* D-Day Alerts Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-surface-variant/10 pt-2">
                <span className="font-bold text-on-surface-variant">
                  마감일 D-Day 알림
                </span>
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

              {/* Difficulty Colors Configuration */}
              <div className="border-t border-surface-variant/10 pt-2.5 space-y-2">
                <span className="block font-bold text-on-surface-variant text-[9px] uppercase tracking-wide">
                  난이도별 색상 (HEX 코드 입력)
                </span>
                <div className="space-y-2 pl-0.5">
                  {/* 쉬움 */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">쉬움 (Easy)</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-300/40 shrink-0"
                        style={{ backgroundColor: settings.colorEasy || "#FFFACD" }}
                      />
                      <input
                        type="text"
                        value={settings.colorEasy || "#FFFACD"}
                        onChange={(e) => updateSettings({ colorEasy: e.target.value })}
                        placeholder="#FFFACD"
                        className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-lg px-2 py-1 text-[9px] font-bold focus:outline-none focus:border-primary text-on-surface uppercase tracking-wide"
                      />
                    </div>
                  </div>
                  {/* 보통 */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">보통 (Medium)</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-300/40 shrink-0"
                        style={{ backgroundColor: settings.colorMedium || "#87CEFA" }}
                      />
                      <input
                        type="text"
                        value={settings.colorMedium || "#87CEFA"}
                        onChange={(e) => updateSettings({ colorMedium: e.target.value })}
                        placeholder="#87CEFA"
                        className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-lg px-2 py-1 text-[9px] font-bold focus:outline-none focus:border-primary text-on-surface uppercase tracking-wide"
                      />
                    </div>
                  </div>
                  {/* 어려움 */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">어려움 (Hard)</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-300/40 shrink-0"
                        style={{ backgroundColor: settings.colorHard || "#FA8072" }}
                      />
                      <input
                        type="text"
                        value={settings.colorHard || "#FA8072"}
                        onChange={(e) => updateSettings({ colorHard: e.target.value })}
                        placeholder="#FA8072"
                        className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-lg px-2 py-1 text-[9px] font-bold focus:outline-none focus:border-primary text-on-surface uppercase tracking-wide"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[8px] text-on-surface-variant/50 leading-tight">
                  HEX 코드를 직접 입력하세요. 예: #FF6B6B
                </p>
              </div>
            </div>
          )}

          {/* Navigation links */}
          <div className="border-t border-surface-variant/10 my-2 pt-2">
            <div className="px-4 py-1 text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
              화면 이동
            </div>
            <button
              onClick={() => {
                onClose();
                router.push("/planner");
              }}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-primary/10 flex items-center gap-3 text-xs font-bold text-on-surface transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base text-primary">
                timer
              </span>
              <span>플래너</span>
            </button>
            <button
              onClick={() => {
                onClose();
                router.push("/calendar");
              }}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-primary/10 flex items-center gap-3 text-xs font-bold text-on-surface transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base text-primary">
                calendar_month
              </span>
              <span>달력</span>
            </button>
            <button
              onClick={() => {
                onClose();
                router.push("/notes");
              }}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-primary/10 flex items-center gap-3 text-xs font-bold text-on-surface transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base text-primary">
                description
              </span>
              <span>노트</span>
            </button>
            <button
              onClick={() => {
                onClose();
                router.push("/character");
              }}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-primary/10 flex items-center gap-3 text-xs font-bold text-on-surface transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base text-primary">
                smart_toy
              </span>
              <span>캐릭터</span>
            </button>
          </div>

          {/* Data Backup & Restore */}
          <div className="border-t border-surface-variant/10 my-2 pt-2">
            <div className="px-4 py-1 text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
              데이터 백업 및 복원
            </div>
            <button
              onClick={handleExportData}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-primary/10 flex items-center gap-3 text-xs font-bold text-on-surface transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base text-primary">
                upload
              </span>
              <span>학습계획 내보내기 (저장)</span>
            </button>
            <label className="w-full px-4 py-2.5 rounded-xl hover:bg-primary/10 flex items-center gap-3 text-xs font-bold text-on-surface transition-all active:scale-[0.98] cursor-pointer">
              <span className="material-symbols-outlined text-base text-primary">
                download
              </span>
              <span>학습계획 가져오기 (불러오기)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full px-4 py-3 rounded-xl hover:bg-error-container/10 flex items-center gap-3 text-xs font-bold text-error transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </>
  );
}
