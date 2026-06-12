// 기존 단일 HTML(code.html)의 캘린더를 Next.js 프레임워크 기반으로 변환하여 구현한 학습 기록 및 기분 관리 달력 화면입니다.
"use client";


import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";

export default function CalendarPage() {
  const {
    tasks,
    calendarNotes,
    calendarMoods,
    currentPlannerDate,
    saveCalendarDay,
    deleteCalendarDay,
  } = useApp();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [selectedMood, setSelectedMood] = useState("");

  const pad = (n: number) => String(n).padStart(2, "0");

  useEffect(() => {
    // Select today's date initially if it's in the current month
    const d = new Date(currentPlannerDate || new Date());
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      setSelectedDay(d.getDate());
    } else {
      setSelectedDay(1);
    }
  }, [currentYear, currentMonth, currentPlannerDate]);

  const changeMonth = (offset: number) => {
    let nextMonth = currentMonth + offset;
    let nextYear = currentYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  const getCalendarCells = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Prev month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        dayNum: prevTotalDays - i,
        isCurrentMonth: false,
        dateKey: "",
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
      cells.push({
        dayNum: day,
        isCurrentMonth: true,
        dateKey,
      });
    }

    // Next month trailing days
    const totalCells = cells.length;
    let nextCells = 42 - totalCells;
    if (totalCells <= 35) nextCells = 35 - totalCells;

    for (let day = 1; day <= nextCells; day++) {
      cells.push({
        dayNum: day,
        isCurrentMonth: false,
        dateKey: "",
      });
    }

    return cells;
  };

  const selectedDateKey = selectedDay
    ? `${currentYear}-${pad(currentMonth + 1)}-${pad(selectedDay)}`
    : "";

  const selectedDayTasks = tasks.filter((t) => t.date === selectedDateKey);
  const selectedDayNote = calendarNotes[selectedDateKey] || "";
  const selectedDayMood = calendarMoods[selectedDateKey] || "";

  const handleOpenNoteModal = () => {
    setNoteInput(selectedDayNote);
    setSelectedMood(selectedDayMood);
    setIsModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!selectedDateKey) return;
    saveCalendarDay(selectedDateKey, noteInput.trim(), selectedMood);
    setIsModalOpen(false);
  };

  const handleDeleteNote = () => {
    if (!selectedDateKey) return;
    deleteCalendarDay(selectedDateKey);
    setIsModalOpen(false);
  };

  const moodEmojis: Record<string, string> = {
    happy: "😊",
    calm: "😐",
    tired: "😴",
    focus: "📝",
    passionate: "🔥",
  };

  const getMoodLabel = (m: string) => {
    if (m === "happy") return " 😊 (기쁨)";
    if (m === "calm") return " 😐 (평온)";
    if (m === "tired") return " 😴 (피곤)";
    if (m === "focus") return " 📝 (집중)";
    if (m === "passionate") return " 🔥 (열정)";
    return "";
  };

  return (
    <div className="flex-1 flex flex-col p-3.5 space-y-3 overflow-hidden">
      
      {/* Month Selector header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="font-headline font-bold text-sm text-primary">월간 플래너</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">chevron_left</span>
          </button>
          <span className="text-[11px] font-bold text-on-surface">
            {currentYear}년 {currentMonth + 1}월
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Days Grid Container */}
      <div className="bg-surface-container-lowest dark:bg-[#1a202c] rounded-2xl p-2.5 border border-surface-variant/20 bubbly-shadow shrink-0">
        <div className="grid grid-cols-7 mb-1.5 text-center text-[9px] font-bold text-on-surface-variant/60">
          <div className="text-error">일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div className="text-secondary">토</div>
        </div>
        <div className="grid grid-cols-7 gap-1 select-none">
          {getCalendarCells().map((cell, idx) => {
            const isToday =
              cell.isCurrentMonth &&
              cell.dayNum === now.getDate() &&
              currentMonth === now.getMonth() &&
              currentYear === now.getFullYear();

            const isSelected = cell.isCurrentMonth && cell.dayNum === selectedDay;

            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={idx}
                  className="aspect-square flex items-center justify-center text-[10px] text-on-surface-variant/20 bg-surface-container-low/40 rounded-lg"
                >
                  {cell.dayNum}
                </div>
              );
            }

            const hasNote = calendarNotes[cell.dateKey];
            const mood = calendarMoods[cell.dateKey];
            const dayTasks = tasks.filter((t) => t.date === cell.dateKey);

            let cellClass =
              "aspect-square flex flex-col items-center justify-center text-[10px] font-bold rounded-lg transition-all active:scale-90 relative cursor-pointer ";

            if (isToday) {
              cellClass += "bg-primary text-white bubbly-shadow";
            } else if (isSelected) {
              cellClass += "bg-primary/20 text-primary border border-primary";
            } else {
              cellClass += "bg-surface-container-low/80 hover:bg-primary-container/20 text-on-surface";
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(cell.dayNum)}
                className={cellClass}
              >
                <span>{cell.dayNum}</span>
                {mood ? (
                  <span className="text-[8px] absolute bottom-0.5">
                    {moodEmojis[mood]}
                  </span>
                ) : dayTasks.length > 0 ? (
                  <div className="flex gap-0.5 justify-center mt-0.5 select-none pointer-events-none max-w-full overflow-hidden absolute bottom-1">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ backgroundColor: t.color }}
                      ></span>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[5px] text-on-surface-variant/60 leading-none font-bold">
                        +
                      </span>
                    )}
                  </div>
                ) : hasNote ? (
                  <span className="w-1.5 h-0.5 bg-primary absolute bottom-1"></span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Memo & Tasks */}
      <div className="flex-1 bg-surface-container-low/60 dark:bg-[#1a202c] rounded-2xl p-3.5 border border-surface-variant/20 flex flex-col gap-1.5 min-h-[120px] overflow-y-auto no-scrollbar pb-16">
        <h4 className="text-[11px] font-bold text-primary flex items-center gap-1 shrink-0">
          <span className="material-symbols-outlined text-[15px]">edit_note</span>
          <span>
            {currentYear}년 {currentMonth + 1}월 {selectedDay}일 메모 및 계획
          </span>
        </h4>
        <div className="flex-1 text-[11px] text-on-surface-variant/90 leading-relaxed space-y-2">
          {selectedDayNote || selectedDayMood ? (
            <div className="p-3 rounded-xl bg-white/40 dark:bg-black/20 border border-surface-variant/10 relative group">
              {selectedDayMood && (
                <div className="font-bold text-secondary text-[10px] mb-1">
                  오늘의 기분: {getMoodLabel(selectedDayMood)}
                </div>
              )}
              {selectedDayNote && (
                <p className="text-on-surface text-[10px] leading-relaxed break-all whitespace-pre-wrap">
                  {selectedDayNote}
                </p>
              )}
              <button
                onClick={handleOpenNoteModal}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-90 cursor-pointer"
                title="편집"
              >
                <span className="material-symbols-outlined text-[13px]">edit</span>
              </button>
            </div>
          ) : (
            <div
              onClick={handleOpenNoteModal}
              className="border-2 border-dashed border-primary/25 hover:border-primary/50 bg-primary/5 rounded-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-primary/10 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base text-primary mb-1">
                add_comment
              </span>
              <span className="text-[9px] font-bold text-primary">
                이 날의 메모 및 기분 추가하기
              </span>
            </div>
          )}

          {/* Day tasks preview list */}
          {selectedDayTasks.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-surface-variant/20">
              <div className="text-[10px] font-bold text-primary mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">list_alt</span>
                <span>학습 계획 ({selectedDayTasks.length}개)</span>
              </div>
              <div className="space-y-1.5">
                {selectedDayTasks.map((t) => {
                  const isCompleted = t.completed === "o";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/40 dark:bg-black/10 border border-surface-variant/10"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: t.color }}
                        ></span>
                        <span
                          className={`text-[10px] font-bold text-on-surface truncate ${
                            isCompleted ? "line-through opacity-50" : ""
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[8px] font-semibold text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container-high/40">
                        {t.duration || "0시간"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CALENDAR PLAN NOTE EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface dark:bg-[#1a202c] rounded-3xl max-w-[340px] w-full p-5 bubbly-shadow border border-surface-variant/20 scale-100 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-headline font-bold text-base text-primary">일반 계획 기록</h3>
                <p className="text-[10px] text-on-surface-variant/80">
                  {currentYear}년 {currentMonth + 1}월 {selectedDay}일
                </p>
              </div>
              <button
                className="p-1 rounded-full hover:bg-surface-container-high"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">메모 작성</label>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl p-3 focus:outline-none focus:border-primary text-xs text-on-surface resize-none"
                  rows={3}
                  placeholder="예: 단어 외우기 마감..."
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1.5">오늘의 기분</label>
                <div className="grid grid-cols-5 gap-1">
                  {Object.entries(moodEmojis).map(([key, emoji]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedMood(key)}
                      className={`py-1.5 rounded-lg border text-center text-[10px] flex flex-col items-center cursor-pointer transition-all ${
                        selectedMood === key
                          ? "border-2 border-primary bg-primary/10 font-bold"
                          : "border-surface-variant bg-surface-container-low hover:bg-surface-container-high"
                      }`}
                    >
                      <span>{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-surface-container-highest hover:bg-surface-dim font-bold text-on-surface-variant text-center transition-colors cursor-pointer"
                >
                  취소
                </button>
                {(selectedDayNote || selectedDayMood) && (
                  <button
                    onClick={handleDeleteNote}
                    className="flex-1 py-2.5 rounded-full bg-error hover:bg-error/80 font-bold text-white text-center transition-colors cursor-pointer"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={handleSaveNote}
                  className="flex-[2] py-2.5 rounded-full bg-primary bubbly-button font-bold text-white text-center transition-all cursor-pointer"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
