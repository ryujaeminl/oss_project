"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApp, type AppSettings } from "@/lib/AppContext";

type MascotKey = AppSettings["activeMascot"];
type MascotPose = "idle" | "happy" | "curious" | "sleepy" | "study" | "dragging";

const MASCOT_IMAGES: Record<MascotKey, string> = {
  woolini:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAL7pl4zo3S5ns-o-IQp1FW_FNeH4JNl2e17Y55WQLVloGJWyPd9QAaITZh2aNHwLGSRJpYy16uKevBs3ccUc5ETPxrfb6pJRBKDOVdkCMxiWAGIw-E3Q_XXrJLvxGrWezytHz_Rmj9b5X2W3oSH7xeGEHGjhym1K5ZETUK8Fo4iWuIv0I-49l5_TYd8eaVQdaWkirZYUv7cKL9mYiqSqG530T6nJwVlZ6hHncdvTO_FEHUkxUEfJUhol9P7Vp11o3PPhzgGDp2Rj8",
  "yang-i": "https://img.icons8.com/color/150/sheep.png",
  "gom-i": "https://img.icons8.com/color/150/teddy-bear.png",
  custom: "https://img.icons8.com/color/150/user.png",
};

interface StudyPlanItem {
  date: string;
  title: string;
  duration: string;
  content: string;
}

interface ChatMessage {
  id: number;
  sender: "user" | "mascot";
  text: string;
  proposedPlan?: StudyPlanItem[];
  planStatus?: "pending" | "added" | "cancelled" | "modified";
}

interface ChatApiResponse {
  reply?: string;
  error?: string;
  proposedPlan?: StudyPlanItem[];
}

type StagePosition = {
  x: number;
  y: number;
};

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const MASCOT_NAMES: Record<MascotKey, string> = {
  woolini: "울리니",
  "yang-i": "양양이",
  "gom-i": "곰곰이",
  custom: "커스텀",
};

const POSE_LABELS: Record<MascotPose, string> = {
  idle: "기분: 편안함",
  happy: "기분: 신남",
  curious: "기분: 호기심",
  sleepy: "기분: 졸림",
  study: "기분: 집중",
  dragging: "기분: 이동 중",
};

export default function CharacterPage() {
  const { settings, addXP, mascotLevel, mascotXP, updateCharacter, createTask } = useApp();

  const [customUrlInput, setCustomUrlInput] = useState(settings.customMascotUrl || "");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [mascotPose, setMascotPose] = useState<MascotPose>("idle");
  const [stagePosition, setStagePosition] = useState<StagePosition>({ x: 50, y: 54 });
  const [stageSpeech, setStageSpeech] = useState("캐릭터를 드래그하거나 아래 버튼으로 상호작용해보세요.");
  const [affection, setAffection] = useState(35);
  const [energy, setEnergy] = useState(72);
  const [followPointer, setFollowPointer] = useState(false);
  const [sparkleSeed, setSparkleSeed] = useState(0);

  const chatViewRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const dragStateRef = useRef({
    dragging: false,
    moved: false,
  });

  const activeMascot = settings.activeMascot || "woolini";
  const xpPercent = Math.min((mascotXP / 1000) * 100, 100);

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  };

  const getActiveMascotUrl = () => {
    if (activeMascot === "custom") {
      return settings.customMascotUrl || MASCOT_IMAGES.custom;
    }
    return MASCOT_IMAGES[activeMascot] || MASCOT_IMAGES.woolini;
  };

  const addMascotMessage = (text: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: nextMessageId(),
        sender: "mascot",
        text,
      },
    ]);
  };

  const clampPosition = (x: number, y: number): StagePosition => ({
    x: Math.min(88, Math.max(12, x)),
    y: Math.min(76, Math.max(26, y)),
  });

  const playStudyBell = () => {
    if (!settings.soundEnabled) return;
    try {
      const audioConstructor =
        window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!audioConstructor) return;
      const audioCtx = new audioConstructor();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.12);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + index * 0.12 + 0.3);
        osc.start(audioCtx.currentTime + index * 0.12);
        osc.stop(audioCtx.currentTime + index * 0.12 + 0.4);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const reactToMascot = (pose: MascotPose, speech: string, xp = 10) => {
    setMascotPose(pose);
    setStageSpeech(speech);
    setAffection((prev) => Math.min(100, prev + Math.max(3, Math.floor(xp / 2))));
    setEnergy((prev) => (pose === "sleepy" ? Math.min(100, prev + 12) : Math.max(8, prev - 4)));
    setSparkleSeed((prev) => prev + 1);
    addXP(xp);
    playStudyBell();
  };

  const handlePetMascot = () => {
    const voiceLines: Record<MascotKey, string> = {
      woolini: "쓰다듬어줘서 힘이 났어요. 오늘 계획도 같이 지켜볼게요.",
      "yang-i": "포근한 응원 충전 완료. 잠깐 숨 고르고 다시 집중해봐요.",
      "gom-i": "좋습니다. 차분하게 한 걸음씩 해내면 됩니다.",
      custom: "나만의 메이트가 응원 에너지를 받았어요.",
    };
    reactToMascot("happy", voiceLines[activeMascot], 25);
    addMascotMessage(voiceLines[activeMascot]);
  };

  const handleInteraction = (pose: MascotPose) => {
    const interactions: Record<MascotPose, string> = {
      idle: "좋아요. 잠깐 대기하면서 다음 계획을 기다릴게요.",
      happy: "응원 모드 켰어요. 오늘 하나만 끝내도 충분히 좋은 흐름입니다.",
      curious: "궁금한 게 있으면 물어봐요. 계획을 작게 쪼개드릴게요.",
      sleepy: "짧게 쉬는 것도 전략이에요. 5분만 숨 고르고 돌아와요.",
      study: "집중 모드로 전환했습니다. 방해 요소는 잠깐 내려놓기.",
      dragging: "여기 위치가 마음에 들어요.",
    };
    reactToMascot(pose, interactions[pose], pose === "study" ? 18 : 12);
    addMascotMessage(interactions[pose]);
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (dragStateRef.current.dragging) {
      dragStateRef.current.moved = true;
      setStagePosition(clampPosition(x, y));
      return;
    }

    if (followPointer) {
      setStagePosition((prev) => {
        const nextX = prev.x + (x - prev.x) * 0.16;
        const nextY = prev.y + (y - prev.y) * 0.16;
        return clampPosition(nextX, nextY);
      });
    }
  };

  const handleMascotPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = { dragging: true, moved: false };
    setMascotPose("dragging");
    setStageSpeech("원하는 위치로 옮겨주세요.");
  };

  const handleMascotPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const wasMoved = dragStateRef.current.moved;
    dragStateRef.current = { dragging: false, moved: false };

    if (wasMoved) {
      reactToMascot("happy", "여기 좋아요. 이 자리에서 같이 공부를 지켜볼게요.", 10);
      return;
    }

    handlePetMascot();
  };

  useEffect(() => {
    if (followPointer) {
      setMascotPose("curious");
      setStageSpeech("마우스나 손가락을 따라가볼게요.");
    }
  }, [followPointer]);

  useEffect(() => {
    if (followPointer) return;

    const interval = window.setInterval(() => {
      if (dragStateRef.current.dragging) return;
      setStagePosition((prev) =>
        clampPosition(
          prev.x + (Math.random() * 16 - 8),
          prev.y + (Math.random() * 10 - 5)
        )
      );
      setMascotPose((prev) => (prev === "idle" ? "curious" : "idle"));
    }, 5200);

    return () => window.clearInterval(interval);
  }, [followPointer]);

  const handleAcceptPlan = async (messageId: number, plan: StudyPlanItem[]) => {
    try {
      for (const item of plan) {
        if (!item?.title) continue;
        await createTask(
          item.title,
          item.content || "",
          null,
          item.duration || "1시간",
          null,
          "#a5d8d1",
          item.date
        );
      }
      setChatMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, planStatus: "added" } : msg))
      );
      reactToMascot("happy", `추천 학습 계획 ${plan.length}개를 플래너에 등록했습니다.`, 20);
      addMascotMessage(`추천 학습 계획 ${plan.length}개를 플래너에 등록했습니다.`);
    } catch (error) {
      console.error("Failed to add tasks:", error);
      alert("플래너에 일정을 추가하는 중 오류가 발생했습니다.");
    }
  };

  const handleEditPlan = (messageId: number) => {
    setChatMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, planStatus: "modified" } : msg))
    );
    const guidance = "학습 계획을 어떻게 수정할까요? 아래 입력창에 수정하고 싶은 내용을 말씀해주세요.";
    setChatInput("방금 추천해준 일정을 조금 줄여줘");
    reactToMascot("curious", guidance, 8);
    addMascotMessage(guidance);
  };

  const handleCancelPlan = (messageId: number) => {
    setChatMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, planStatus: "cancelled" } : msg))
    );
    reactToMascot("idle", "학습 계획 제안을 취소했습니다.", 5);
    addMascotMessage("학습 계획 제안을 취소했습니다. 다른 도움이 필요하면 다시 말해주세요.");
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: nextMessageId(),
      sender: "user",
      text,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    reactToMascot("study", "답변을 생각하고 있어요.", 3);

    const history = chatMessages.map((msg) => ({
      role: (msg.sender === "user" ? "user" : "model") as "user" | "model",
      parts: [msg.text],
    }));

    const typingId = nextMessageId();
    try {
      setChatMessages((prev) => [
        ...prev,
        {
          id: typingId,
          sender: "mascot",
          text: "생각 중...",
        },
      ]);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = (await res.json()) as ChatApiResponse;
      setChatMessages((prev) => prev.filter((msg) => msg.id !== typingId));

      if (res.ok && data.reply) {
        const replyText = data.reply;
        setChatMessages((prev) => [
          ...prev,
          {
            id: nextMessageId(),
            sender: "mascot",
            text: replyText,
            proposedPlan: data.proposedPlan,
            planStatus: data.proposedPlan ? "pending" : undefined,
          },
        ]);
        reactToMascot(data.proposedPlan ? "curious" : "happy", "답변을 준비했어요.", 12);
      } else {
        const fallback = data.error || "지금은 답변을 만들지 못했어요. 잠시 후 다시 물어봐주세요.";
        setChatMessages((prev) => [
          ...prev,
          {
            id: nextMessageId(),
            sender: "mascot",
            text: fallback,
          },
        ]);
        reactToMascot("sleepy", fallback, 4);
      }
    } catch (error) {
      console.error(error);
      setChatMessages((prev) => prev.filter((msg) => msg.id !== typingId));
      const fallback = "연결이 잠깐 불안정해요. 그래도 오늘 계획은 작게 나눠서 시작해볼 수 있어요.";
      setChatMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          sender: "mascot",
          text: fallback,
        },
      ]);
      reactToMascot("sleepy", fallback, 4);
    }
  };

  useEffect(() => {
    if (chatViewRef.current) {
      chatViewRef.current.scrollTop = chatViewRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSelectMascot = (key: MascotKey) => {
    const imageUrl =
      key === "custom" ? settings.customMascotUrl || "" : MASCOT_IMAGES[key];
    updateCharacter(key, MASCOT_NAMES[key], imageUrl);
    reactToMascot("happy", `파트너가 ${MASCOT_NAMES[key]}(으)로 교체되었습니다.`, 10);
    addMascotMessage(`파트너가 ${MASCOT_NAMES[key]}(으)로 교체되었습니다.`);
  };

  const handleSaveCustomImage = () => {
    const url = customUrlInput.trim();
    if (!url) {
      alert("이미지 주소를 입력하세요.");
      return;
    }
    updateCharacter("custom", "커스텀", url);
    reactToMascot("happy", "나만의 커스텀 캐릭터 이미지가 등록되었습니다.", 15);
    addMascotMessage("나만의 커스텀 캐릭터 이미지가 등록되었습니다.");
  };

  const handleCustomMascotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateCharacter("custom", "커스텀", dataUrl);
      setCustomUrlInput(dataUrl);
      reactToMascot("happy", "나만의 커스텀 캐릭터 사진이 등록되었습니다.", 15);
      addMascotMessage("나만의 커스텀 캐릭터 사진이 등록되었습니다.");
    };
    reader.readAsDataURL(file);
  };

  const mascotsList: Array<{ key: MascotKey; label: string; src: string }> = [
    { key: "woolini", label: "울리니", src: MASCOT_IMAGES.woolini },
    { key: "yang-i", label: "양양이", src: MASCOT_IMAGES["yang-i"] },
    { key: "gom-i", label: "곰곰이", src: MASCOT_IMAGES["gom-i"] },
    {
      key: "custom",
      label: "커스텀",
      src: settings.customMascotUrl || MASCOT_IMAGES.custom,
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-3.5 space-y-3 overflow-y-auto no-scrollbar pb-16">
      <div className="bg-surface-container-low rounded-2xl p-3 border border-surface-variant/20 flex items-center gap-3 relative bubbly-shadow shrink-0">
        <button
          type="button"
          className={`w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center overflow-hidden border border-primary/20 cursor-grab select-none active:cursor-grabbing transition-transform mascot-avatar mascot-pose-${mascotPose}`}
          onPointerDown={handleMascotPointerDown}
          onPointerUp={handleMascotPointerUp}
          aria-label="캐릭터 쓰다듬기"
        >
          <img className="w-11 h-11 object-contain pointer-events-none" src={getActiveMascotUrl()} alt="Mascot" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-headline font-bold text-xs text-primary">{MASCOT_NAMES[activeMascot]}</h3>
            <span className="text-[8px] bg-secondary-container/50 text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
              {POSE_LABELS[mascotPose]}
            </span>
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center justify-between text-[8px] font-bold text-on-surface-variant">
              <span>Level {mascotLevel}</span>
              <span>{mascotXP} / 1000 XP</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div
        ref={stageRef}
        onPointerMove={handleStagePointerMove}
        className="relative h-56 shrink-0 overflow-hidden rounded-2xl border border-surface-variant/30 bg-surface-container-lowest bubbly-shadow mascot-stage"
      >
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFollowPointer((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all ${
              followPointer
                ? "bg-primary text-white border-primary"
                : "bg-white/70 dark:bg-black/20 text-primary border-primary/30"
            }`}
          >
            따라오기
          </button>
          <button
            type="button"
            onClick={() => handleInteraction("idle")}
            className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/70 dark:bg-black/20 text-on-surface-variant border border-surface-variant/40"
          >
            제자리
          </button>
        </div>

        <div className="absolute right-3 top-3 z-10 grid grid-cols-2 gap-1 text-[8px] font-bold">
          <div className="rounded-lg bg-white/75 dark:bg-black/25 px-2 py-1 text-on-surface-variant">
            친밀도 {affection}%
          </div>
          <div className="rounded-lg bg-white/75 dark:bg-black/25 px-2 py-1 text-on-surface-variant">
            에너지 {energy}%
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-5 h-10 rounded-[50%] bg-primary/10 blur-sm" />
        <div className="absolute inset-x-8 bottom-7 h-px bg-primary/15" />

        <div
          className={`absolute z-20 transition-[left,top] duration-500 ease-out mascot-stage-body mascot-pose-${mascotPose}`}
          style={{
            left: `${stagePosition.x}%`,
            top: `${stagePosition.y}%`,
          }}
        >
          <div className="absolute bottom-full left-1/2 mb-2 w-44 -translate-x-1/2 rounded-xl rounded-br-sm bg-secondary px-3 py-2 text-center text-[9px] font-bold leading-snug text-white shadow-md">
            {stageSpeech}
          </div>
          <button
            type="button"
            onPointerDown={handleMascotPointerDown}
            onPointerUp={handleMascotPointerUp}
            className="relative flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-white/70 bg-white/55 p-3 shadow-xl backdrop-blur-md active:cursor-grabbing"
            aria-label="무대 위 캐릭터"
          >
            <img className="h-16 w-16 object-contain pointer-events-none" src={getActiveMascotUrl()} alt="Mascot" />
            <span key={sparkleSeed} className="mascot-sparkle" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <button onClick={() => handleInteraction("happy")} className="py-2 rounded-xl bg-primary text-white text-[9px] font-bold">
          응원
        </button>
        <button onClick={() => handleInteraction("curious")} className="py-2 rounded-xl bg-secondary text-white text-[9px] font-bold">
          질문
        </button>
        <button onClick={() => handleInteraction("study")} className="py-2 rounded-xl bg-tertiary text-white text-[9px] font-bold">
          집중
        </button>
        <button onClick={() => handleInteraction("sleepy")} className="py-2 rounded-xl bg-surface-container-highest text-on-surface-variant text-[9px] font-bold">
          휴식
        </button>
      </div>

      <div className="flex-1 flex flex-col bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3.5 border border-surface-variant/30 min-h-[180px] bubbly-shadow shrink-0">
        <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block mb-2 select-none">
          울리니 AI 스터디 메이트
        </span>
        <div
          ref={chatViewRef}
          className="flex-1 bg-surface-container-low rounded-xl p-2.5 border border-surface-variant/20 overflow-y-auto custom-scrollbar flex flex-col gap-2 max-h-[170px]"
        >
          {chatMessages.length === 0 ? (
            <p className="text-[9px] text-on-surface-variant/50 italic text-center my-auto select-none">
              캐릭터와 상호작용하거나 질문을 보내보세요.
            </p>
          ) : (
            chatMessages.map((msg) =>
              msg.sender === "user" ? (
                <div key={msg.id} className="flex gap-2 items-start justify-end">
                  <div className="bg-primary text-white px-3 py-1.5 rounded-xl rounded-tr-none text-xs leading-normal max-w-[80%]">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                    <img className="w-5 h-5 object-contain" src={getActiveMascotUrl()} alt="Mascot" />
                  </div>
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    <div className="bg-secondary/10 text-on-secondary-container px-3 py-1.5 rounded-xl rounded-tl-none text-xs leading-normal w-full">
                      {msg.text}
                    </div>
                    {msg.proposedPlan && msg.proposedPlan.length > 0 && (
                      <div className="bg-surface-container-low border border-surface-variant/40 rounded-xl p-3 flex flex-col gap-2 bubbly-shadow mt-1 text-on-surface">
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1 select-none">
                          <span className="material-symbols-outlined text-xs">auto_awesome</span>
                          AI 추천 학습 계획
                        </span>
                        <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                          {msg.proposedPlan.map((item, idx) => (
                            <div key={idx} className="bg-surface-container-highest/50 border border-surface-variant/25 rounded-lg p-2 flex flex-col gap-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-on-surface-variant">{item.date}</span>
                                <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{item.duration}</span>
                              </div>
                              <span className="text-xs font-bold text-on-surface">{item.title}</span>
                              {item.content && <span className="text-[9px] text-on-surface-variant/85 leading-normal">{item.content}</span>}
                            </div>
                          ))}
                        </div>
                        {msg.planStatus === "pending" && (
                          <div className="flex gap-1.5 mt-1 pt-1.5 border-t border-surface-variant/10">
                            <button onClick={() => handleAcceptPlan(msg.id, msg.proposedPlan!)} className="flex-1 py-1 bg-primary text-white text-[9px] font-bold rounded-lg active:scale-95 transition-all cursor-pointer text-center">
                              추가하기
                            </button>
                            <button onClick={() => handleEditPlan(msg.id)} className="flex-1 py-1 border border-primary text-primary hover:bg-primary/5 text-[9px] font-bold rounded-lg active:scale-95 transition-all cursor-pointer text-center">
                              수정하기
                            </button>
                            <button onClick={() => handleCancelPlan(msg.id)} className="py-1 px-2.5 bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high text-[9px] font-bold rounded-lg active:scale-95 transition-all cursor-pointer text-center">
                              취소
                            </button>
                          </div>
                        )}
                        {msg.planStatus === "added" && (
                          <div className="text-center text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 py-1 rounded-lg mt-1 select-none border border-emerald-500/10">
                            플래너에 등록되었습니다.
                          </div>
                        )}
                        {msg.planStatus === "cancelled" && (
                          <div className="text-center text-[9px] font-bold text-on-surface-variant/60 bg-surface-container-high py-1 rounded-lg mt-1 select-none border border-surface-variant/10">
                            계획 등록이 취소되었습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            )
          )}
        </div>
        <div className="flex gap-2 mt-2 pt-2 border-t border-surface-variant/20">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendChat();
            }}
            placeholder="학습 피드백이나 질문을 해보세요..."
            className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-full px-4 py-1.5 text-xs focus:outline-none focus:border-secondary text-on-surface"
          />
          <button
            onClick={handleSendChat}
            className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md active:scale-90 transition-all shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[13px]">send</span>
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-3 border border-surface-variant/20 flex flex-col gap-2 shrink-0">
        <span className="text-[9px] font-bold text-on-surface-variant block uppercase tracking-wider select-none">
          학습 메이트 캐릭터 선택 & 나만의 이미지 추가
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {mascotsList.map((m) => (
            <button
              key={m.key}
              onClick={() => handleSelectMascot(m.key)}
              className={`flex flex-col items-center gap-1 p-1 rounded-xl border transition-all cursor-pointer ${
                activeMascot === m.key
                  ? "border-2 border-primary bg-primary-container/20"
                  : "border-surface-variant bg-surface-container-lowest opacity-85 hover:opacity-100"
              }`}
            >
              <img className={`w-7 h-7 object-contain ${m.key === "custom" ? "rounded-full" : ""}`} src={m.src} alt={m.label} />
              <span className="text-[7px] font-bold">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 mt-1 border-t border-surface-variant/20 pt-2 text-[9px]">
          <div className="flex gap-1.5 items-center">
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="나만의 캐릭터 이미지 주소..."
              className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-1.5 text-[9px] focus:outline-none focus:border-primary text-on-surface"
            />
            <button onClick={handleSaveCustomImage} className="px-3 py-1.5 bg-primary text-white text-[9px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer">
              등록
            </button>
          </div>
          <div className="flex justify-between items-center gap-1.5 border-t border-dashed border-surface-variant/10 pt-1.5">
            <span className="text-on-surface-variant/60 font-semibold pl-1">
              또는 로컬 사진 파일 업로드:
            </span>
            <label className="px-3 py-1 bg-secondary text-white text-[9px] font-bold rounded-xl cursor-pointer hover:bg-secondary/95 transition-colors shrink-0 text-center select-none active:scale-95">
              <span>사진 선택</span>
              <input type="file" accept="image/*" onChange={handleCustomMascotUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
