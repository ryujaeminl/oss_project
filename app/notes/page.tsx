// 기존 단일 HTML(code.html)의 오답노트/개념 노트를 Next.js 프레임워크 기반으로 전환하여 구현한 개념 정리 및 오답 노트 관리 화면입니다.
"use client";


import React, { useState } from "react";
import { useApp, Concept, WrongAnswer } from "@/lib/AppContext";

export default function NotesPage() {
  const {
    concepts,
    setConcepts,
    wrongAnswers,
    setWrongAnswers,
    currentPlannerDate,
    addXP,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<"concept" | "wrong">("concept");

  // Form states for concepts
  const [conceptDate, setConceptDate] = useState(currentPlannerDate);
  const [conceptSubject, setConceptSubject] = useState("");
  const [conceptContent, setConceptContent] = useState("");

  // Form states for wrong answers
  const [waSubject, setWaSubject] = useState("");
  const [waTitle, setWaTitle] = useState("");
  const [waDesc, setWaDesc] = useState("");
  const [waImageUrl, setWaImageUrl] = useState("");

  const todayConcepts = concepts[currentPlannerDate] || [];
  const todayWrongAnswers = wrongAnswers[currentPlannerDate] || [];

  // Concepts Handlers
  const handleAddConcept = () => {
    if (!conceptDate || !conceptSubject.trim() || !conceptContent.trim()) {
      alert("날짜, 과목, 요약 내용은 필수 입력 사항입니다.");
      return;
    }

    const newConcept: Concept = {
      id: Date.now(),
      subject: conceptSubject.trim(),
      date: conceptDate,
      content: conceptContent.trim(),
    };

    setConcepts((prev) => {
      const dayConcepts = prev[conceptDate] || [];
      return {
        ...prev,
        [conceptDate]: [...dayConcepts, newConcept],
      };
    });

    addXP(15);
    alert("개념 요약이 추가되었습니다! 💡");

    setConceptSubject("");
    setConceptContent("");
  };

  const handleDeleteConcept = (id: number) => {
    setConcepts((prev) => {
      const dayConcepts = prev[currentPlannerDate] || [];
      return {
        ...prev,
        [currentPlannerDate]: dayConcepts.filter((c) => c.id !== id),
      };
    });
  };

  const handleDownloadConcept = (item: Concept) => {
    const contentText = `[스터디 플래너 개념 요약]\n날짜: ${item.date}\n과목: ${item.subject}\n\n[요약 내용]\n${item.content}`;
    const blob = new Blob([contentText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `개념요약_${item.subject}_${item.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllConcepts = () => {
    if (todayConcepts.length === 0) {
      alert("다운로드할 개념 요약이 없습니다.");
      return;
    }

    let contentText = `=== 스터디 플래너 개념 요약 (${currentPlannerDate}) ===\n\n`;
    todayConcepts.forEach((item, index) => {
      contentText += `[${index + 1}] 과목: ${item.subject} | 날짜: ${item.date}\n`;
      contentText += `내용:\n${item.content}\n`;
      contentText += `-`.repeat(40) + `\n\n`;
    });

    const blob = new Blob([contentText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `개념요약_전체_${currentPlannerDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Wrong Answers Handlers
  const handleAddWrongAnswer = () => {
    if (!waSubject.trim() || !waTitle.trim() || !waDesc.trim()) {
      alert("과목, 문제명, 원인을 모두 입력해주세요.");
      return;
    }

    const newWa: WrongAnswer = {
      id: Date.now(),
      subject: waSubject.trim(),
      title: waTitle.trim(),
      desc: waDesc.trim(),
      imageUrl: waImageUrl.trim(),
      resolved: false,
    };

    setWrongAnswers((prev) => {
      const dayWas = prev[currentPlannerDate] || [];
      return {
        ...prev,
        [currentPlannerDate]: [...dayWas, newWa],
      };
    });

    alert("새 오답노트 카드가 추가되었습니다! 📝");

    setWaSubject("");
    setWaTitle("");
    setWaDesc("");
    setWaImageUrl("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setWaImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleResolve = (id: number) => {
    setWrongAnswers((prev) => {
      const dayWas = prev[currentPlannerDate] || [];
      return {
        ...prev,
        [currentPlannerDate]: dayWas.map((wa) => {
          if (wa.id === id) {
            const nextResolved = !wa.resolved;
            if (nextResolved) addXP(40);
            return { ...wa, resolved: nextResolved };
          }
          return wa;
        }),
      };
    });
  };

  const handleDeleteWrongAnswer = (id: number) => {
    setWrongAnswers((prev) => {
      const dayWas = prev[currentPlannerDate] || [];
      return {
        ...prev,
        [currentPlannerDate]: dayWas.filter((wa) => wa.id !== id),
      };
    });
  };

  return (
    <div className="flex-1 flex flex-col p-3.5 space-y-3.5 overflow-hidden">
      
      {/* Sub-tab selection */}
      <div className="grid grid-cols-2 p-1 bg-surface-container-high rounded-full border border-surface-variant/20 shrink-0 select-none">
        <button
          onClick={() => setActiveSubTab("concept")}
          className={`py-2 rounded-full text-center text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "concept"
              ? "bg-primary text-white shadow"
              : "text-on-surface-variant/80 hover:text-primary"
          }`}
        >
          개념 요약
        </button>
        <button
          onClick={() => setActiveSubTab("wrong")}
          className={`py-2 rounded-full text-center text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "wrong"
              ? "bg-primary text-white shadow"
              : "text-on-surface-variant/80 hover:text-primary"
          }`}
        >
          오답노트
        </button>
      </div>

      {/* Concept Summary View */}
      {activeSubTab === "concept" ? (
        <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto no-scrollbar pb-16">
          <div className="flex-1 flex flex-col bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3 border border-surface-variant/30 min-h-[200px] shadow-sm">
            <div className="flex justify-between items-center mb-2 shrink-0 select-none">
              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                <span>오늘의 개념 및 메모 정리 목록</span>
              </span>
              <button
                onClick={handleDownloadAllConcepts}
                className="px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-[9px] font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                title="전체 다운로드"
              >
                <span className="material-symbols-outlined text-[12px]">download</span>
                <span>전체 다운로드</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar space-y-2 mb-3">
              {todayConcepts.length === 0 ? (
                <p className="text-xs text-on-surface-variant/60 italic text-center py-4 select-none">
                  등록된 개념 요약이 없습니다.
                </p>
              ) : (
                todayConcepts.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-surface-variant/30 bg-surface-container-low/40 flex flex-col gap-1.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-1.5 select-none">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white">
                          {item.subject}
                        </span>
                        <span className="text-[9px] font-bold text-on-surface-variant/70">
                          {item.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDownloadConcept(item)}
                          className="p-1 rounded-md hover:bg-surface-container-high transition-colors cursor-pointer text-primary"
                          title="다운로드"
                        >
                          <span className="material-symbols-outlined text-[15px]">download</span>
                        </button>
                        <button
                          onClick={() => handleDeleteConcept(item.id)}
                          className="p-1 rounded-md text-on-surface-variant/40 hover:text-error transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-on-surface leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Concept inputs */}
            <div className="bg-surface-container-low p-2.5 rounded-xl border border-surface-variant/20 space-y-2 text-[10px] shrink-0">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={conceptDate}
                  onChange={(e) => setConceptDate(e.target.value)}
                  className="bg-white dark:bg-black border border-outline-variant/60 rounded-lg px-2 py-1.5 focus:outline-none text-on-surface"
                />
                <input
                  type="text"
                  value={conceptSubject}
                  onChange={(e) => setConceptSubject(e.target.value)}
                  placeholder="과목 (예: 수학)"
                  className="bg-white dark:bg-black border border-outline-variant/60 rounded-lg px-2 py-1.5 focus:outline-none text-on-surface"
                />
              </div>
              <textarea
                value={conceptContent}
                onChange={(e) => setConceptContent(e.target.value)}
                placeholder="공부한 주요 공식이나 핵심 요약 내용을 기록하세요..."
                className="w-full bg-white dark:bg-black border border-outline-variant/60 rounded-lg p-2 text-xs text-on-surface resize-none focus:outline-none focus:border-primary"
                rows={3}
              />
              <button
                onClick={handleAddConcept}
                className="w-full py-2 bg-primary text-white font-bold rounded-lg transition-transform active:scale-95 cursor-pointer"
              >
                개념 요약 추가하기
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Wrong Answer Notes View */
        <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto no-scrollbar pb-16">
          <div className="flex-1 flex flex-col bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3 border border-surface-variant/30 min-h-[200px] shadow-sm">
            <span className="text-[10px] font-bold text-secondary flex items-center gap-1 mb-2 select-none shrink-0">
              <span className="material-symbols-outlined text-[14px]">assignment_late</span>
              <span>오답노트 관리</span>
            </span>

            <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar space-y-2 mb-3">
              {todayWrongAnswers.length === 0 ? (
                <p className="text-xs text-on-surface-variant/60 italic text-center py-4 select-none">
                  등록된 오답노트가 없습니다.
                </p>
              ) : (
                todayWrongAnswers.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                      item.resolved
                        ? "border-primary bg-primary/5"
                        : "border-surface-variant/30 bg-surface-container-low/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 select-none">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.resolved
                              ? "bg-primary text-white"
                              : "bg-surface-container-high text-on-surface-variant/80"
                          }`}
                        >
                          {item.subject}
                        </span>
                        <span className="text-[10px] font-bold text-on-surface truncate">
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleResolve(item.id)}
                          className="p-1 rounded-md hover:bg-surface-container-high transition-colors cursor-pointer text-primary"
                          title={item.resolved ? "해결 취소" : "해결 완료"}
                        >
                          <span
                            className={`material-symbols-outlined text-[15px] ${
                              item.resolved ? "text-primary" : "text-on-surface-variant/40"
                            }`}
                          >
                            check_circle
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteWrongAnswer(item.id)}
                          className="p-1 rounded-md text-on-surface-variant/40 hover:text-error transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[9px] text-on-surface-variant leading-relaxed">
                      {item.desc}
                    </p>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt="Wrong answer snippet"
                        className="w-full max-h-24 object-contain rounded-lg border border-surface-variant/10 mt-1"
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Wrong answer inputs */}
            <div className="bg-surface-container-low p-2.5 rounded-xl border border-surface-variant/20 space-y-2 text-[10px] shrink-0">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={waSubject}
                  onChange={(e) => setWaSubject(e.target.value)}
                  placeholder="과목 (예: 수학)"
                  className="bg-white dark:bg-black border border-outline-variant/60 rounded-lg px-2 py-1.5 focus:outline-none text-on-surface"
                />
                <input
                  type="text"
                  value={waTitle}
                  onChange={(e) => setWaTitle(e.target.value)}
                  placeholder="오답노트 제목 (예: 미적 12번)"
                  className="bg-white dark:bg-black border border-outline-variant/60 rounded-lg px-2 py-1.5 focus:outline-none text-on-surface"
                />
              </div>
              <input
                type="text"
                value={waDesc}
                onChange={(e) => setWaDesc(e.target.value)}
                placeholder="틀린 원인이나 해결 방안..."
                className="w-full bg-white dark:bg-black border border-outline-variant/60 rounded-lg px-2 py-1.5 focus:outline-none text-on-surface"
              />
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={waImageUrl}
                  onChange={(e) => setWaImageUrl(e.target.value)}
                  placeholder="참조 문제 이미지 주소 (선택)"
                  className="flex-1 bg-white dark:bg-black border border-outline-variant/60 rounded-lg px-2 py-1 focus:outline-none text-on-surface text-[10px]"
                />
                <label className="px-2 py-1 bg-white dark:bg-black border border-outline-variant/60 rounded-lg cursor-pointer text-[10px] font-bold text-on-surface-variant hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shrink-0">
                  <span>사진 파일</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <button
                onClick={handleAddWrongAnswer}
                className="w-full py-2 bg-secondary text-white font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
              >
                오답 기록 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
