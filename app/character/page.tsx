// 기존 단일 HTML(code.html)의 마스코트 상호작용 및 캐릭터 기능을 Next.js 프레임워크 기반으로 전환하여 구현한 캐릭터 육성 및 스터디 메이트 화면입니다.
"use client";


import React, { useState, useRef, useEffect } from "react";
import { useApp, type AppSettings } from "@/lib/AppContext";

type MascotKey = AppSettings["activeMascot"];

const MASCOT_IMAGES: Record<string, string> = {
  woolini:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAL7pl4zo3S5ns-o-IQp1FW_FNeH4JNl2e17Y55WQLVloGJWyPd9QAaITZh2aNHwLGSRJpYy16uKevBs3ccUc5ETPxrfb6pJRBKDOVdkCMxiWAGIw-E3Q_XXrJLvxGrWezytHz_Rmj9b5X2W3oSH7xeGEHGjhym1K5ZETUK8Fo4iWuIv0I-49l5_TYd8eaVQdaWkirZYUv7cKL9mYiqSqG530T6nJwVlZ6hHncdvTO_FEHUkxUEfJUhol9P7Vp11o3PPhzgGDp2Rj8",
  "yang-i": "https://img.icons8.com/color/150/sheep.png",
  "gom-i": "https://img.icons8.com/color/150/teddy-bear.png",
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

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export default function CharacterPage() {
  const { settings, addXP, mascotLevel, mascotXP, updateCharacter, createTask } = useApp();

  const [customUrlInput, setCustomUrlInput] = useState(
    settings.customMascotUrl || ""
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatViewRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  };

  const activeMascot = settings.activeMascot || "woolini";

  const getActiveMascotUrl = () => {
    if (activeMascot === "custom")
      return settings.customMascotUrl || MASCOT_IMAGES.woolini;
    return MASCOT_IMAGES[activeMascot] || MASCOT_IMAGES.woolini;
  };

  const getMascotName = () => {
    if (activeMascot === "woolini") return "울리니";
    if (activeMascot === "yang-i") return "양양이";
    if (activeMascot === "gom-i") return "곰곰이";
    return "커스텀";
  };

  const getMascotMood = () => {
    const moods: Record<string, string> = {
      woolini: "기분: 포근함 🐉",
      "yang-i": "기분: 평온함 🐑",
      "gom-i": "기분: 의젓함 🐻",
      custom: "기분: 신비로움 ✨",
    };
    return moods[activeMascot] || moods.woolini;
  };

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
        osc.frequency.setValueAtTime(
          freq,
          audioCtx.currentTime + index * 0.12
        );
        gain.gain.setValueAtTime(
          0.12,
          audioCtx.currentTime + index * 0.12
        );
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          audioCtx.currentTime + index * 0.12 + 0.3
        );
        osc.start(audioCtx.currentTime + index * 0.12);
        osc.stop(audioCtx.currentTime + index * 0.12 + 0.4);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePetMascot = () => {
    addXP(25);
    playStudyBell();

    const voiceLines: Record<string, string> = {
      woolini: "우와, 쓰다듬어 주셔서 기분이 정말 날아갈 것 같아요! 공부 힘내세요! 🐉",
      "yang-i": "보송보송한 털을 만져주시니 공부에 더 집중할 수 있을 것 같아요! 🐑",
      "gom-i": "우직하게 곁을 지키며 함께 공부하겠습니다. 쓰다듬어주어 고마워요. 🐻",
      custom: "쓰다듬어주셔서 정말 기뻐요! 힘내서 목표를 완수합시다! ✨",
    };

    const newMsg: ChatMessage = {
      id: nextMessageId(),
      sender: "mascot",
      text: voiceLines[activeMascot] || voiceLines.woolini,
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const handleAcceptPlan = async (messageId: number, plan: StudyPlanItem[]) => {
    try {
      for (const item of plan) {
        if (!item || !item.title) continue;
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
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, planStatus: "added" } : msg
        )
      );
      const successMsg: ChatMessage = {
        id: nextMessageId(),
        sender: "mascot",
        text: `추천 학습 계획 ${plan.length}개를 플래너에 성공적으로 등록했습니다! 화이팅이에요! 🐉✨`,
      };
      setChatMessages((prev) => [...prev, successMsg]);
      playStudyBell();
    } catch (error) {
      console.error("Failed to add tasks:", error);
      alert("플래너에 일정을 추가하는 중 오류가 발생했습니다.");
    }
  };

  const handleEditPlan = (messageId: number) => {
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, planStatus: "modified" } : msg
      )
    );
    const guidanceMsg: ChatMessage = {
      id: nextMessageId(),
      sender: "mascot",
      text: "학습 계획을 어떻게 수정할까요? 아래 입력창에 수정하고 싶은 내용을 말씀해주세요! (예: '수학 공부 시간을 줄여줘', '일정을 내일로 옮겨줘')",
    };
    setChatMessages((prev) => [...prev, guidanceMsg]);
    setChatInput("방금 추천해준 일정을 조금 줄여줘");
  };

  const handleCancelPlan = (messageId: number) => {
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, planStatus: "cancelled" } : msg
      )
    );
    const cancelMsg: ChatMessage = {
      id: nextMessageId(),
      sender: "mascot",
      text: "학습 계획 제안을 취소했습니다. 다른 도움이 필요하시면 언제든 말씀해주세요!",
    };
    setChatMessages((prev) => [...prev, cancelMsg]);
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

    const history = chatMessages.map((msg) => ({
      role: (msg.sender === "user" ? "user" : "model") as "user" | "model",
      parts: [msg.text],
    }));

    const typingId = nextMessageId();
    try {
      const typingMsg: ChatMessage = {
        id: typingId,
        sender: "mascot",
        text: "생각 중... 🐉",
      };
      setChatMessages((prev) => [...prev, typingMsg]);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = (await res.json()) as ChatApiResponse;
      
      setChatMessages((prev) =>
        prev.filter((msg) => msg.id !== typingId)
      );

      if (res.ok && data.reply) {
        const aiMsg: ChatMessage = {
          id: nextMessageId(),
          sender: "mascot",
          text: data.reply,
          proposedPlan: data.proposedPlan,
          planStatus: data.proposedPlan ? "pending" : undefined,
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        playStudyBell();
      } else {
        const answers: Record<string, string> = {
          woolini: "멋진 질문이에요! 계획을 단계별로 쪼개어 실천하면, 수학 복습도 훨씬 쉬워질 거예요! 🐉",
          "yang-i": "학습 집중도가 상승하고 있어요. 10분 단위로 리프레시하며 오답노트를 적극 작성해봐요! 🐑",
          "gom-i": "차근차근 실력을 쌓아가는 모습이 듬직합니다. 오늘 공부 시간 목표도 곰곰이 지켜볼게요. 🐻",
          custom: "정말 현명한 생각입니다. 지속 가능한 실천을 위해 1분 단위 상세 계획을 지켜봐요! ✨",
        };
        const aiMsg: ChatMessage = {
          id: nextMessageId(),
          sender: "mascot",
          text: data.error || answers[activeMascot] || answers.woolini,
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        playStudyBell();
      }
    } catch (e) {
      console.error(e);
      setChatMessages((prev) =>
        prev.filter((msg) => msg.id !== typingId)
      );
      const answers: Record<string, string> = {
        woolini: "멋진 질문이에요! 계획을 단계별로 쪼개어 실천하면, 수학 복습도 훨씬 쉬워질 거예요! 🐉",
        "yang-i": "학습 집중도가 상승하고 있어요. 10분 단위로 리프레시하며 오답노트를 적극 작성해봐요! 🐑",
        "gom-i": "차근차근 실력을 쌓아가는 모습이 듬직합니다. 오늘 공부 시간 목표도 곰곰이 지켜볼게요. 🐻",
        custom: "정말 현명한 생각입니다. 지속 가능한 실천을 위해 1분 단위 상세 계획을 지켜봐요! ✨",
      };
      const aiMsg: ChatMessage = {
        id: nextMessageId(),
        sender: "mascot",
        text: answers[activeMascot] || answers.woolini,
      };
      setChatMessages((prev) => [...prev, aiMsg]);
      playStudyBell();
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatViewRef.current) {
      chatViewRef.current.scrollTop = chatViewRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSelectMascot = (key: MascotKey) => {
    const nameMap: Record<MascotKey, string> = {
      woolini: "울리니",
      "yang-i": "양양이",
      "gom-i": "곰곰이",
      custom: "커스텀",
    };
    
    let imageUrl = "";
    if (key === "woolini") imageUrl = MASCOT_IMAGES.woolini;
    else if (key === "yang-i") imageUrl = MASCOT_IMAGES["yang-i"];
    else if (key === "gom-i") imageUrl = MASCOT_IMAGES["gom-i"];
    else if (key === "custom") imageUrl = settings.customMascotUrl || "";

    updateCharacter(key, nameMap[key] || key, imageUrl);

    const newMsg: ChatMessage = {
      id: nextMessageId(),
      sender: "mascot",
      text: `파트너가 ${nameMap[key] || key}(으)로 교체되었습니다! 🐾`,
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const handleSaveCustomImage = () => {
    const url = customUrlInput.trim();
    if (!url) {
      alert("이미지 주소를 입력하세요.");
      return;
    }
    updateCharacter("custom", "커스텀", url);
    const newMsg: ChatMessage = {
      id: nextMessageId(),
      sender: "mascot",
      text: "나만의 커스텀 캐릭터 이미지가 등록되었습니다! 🐾",
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const handleCustomMascotUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateCharacter("custom", "커스텀", dataUrl);
        setCustomUrlInput(dataUrl);
        const newMsg: ChatMessage = {
          id: nextMessageId(),
          sender: "mascot",
          text: "나만의 커스텀 캐릭터 사진이 등록되었습니다! 🐾",
        };
        setChatMessages((prev) => [...prev, newMsg]);
      };
      reader.readAsDataURL(file);
    }
  };

  const xpPercent = Math.min((mascotXP / 1000) * 100, 100);

  const mascotsList: Array<{ key: MascotKey; label: string; src: string }> = [
    { key: "woolini", label: "울리니", src: MASCOT_IMAGES.woolini },
    { key: "yang-i", label: "양양이", src: MASCOT_IMAGES["yang-i"] },
    { key: "gom-i", label: "곰곰이", src: MASCOT_IMAGES["gom-i"] },
    {
      key: "custom",
      label: "커스텀",
      src:
        settings.customMascotUrl ||
        "https://img.icons8.com/color/150/user.png",
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-3.5 space-y-3 overflow-y-auto no-scrollbar pb-16">
      {/* Mascot info card */}
      <div className="bg-surface-container-low rounded-2xl p-3 border border-surface-variant/20 flex items-center gap-3 relative bubbly-shadow shrink-0">
        <div
          className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center overflow-hidden border border-primary/20 floating-mate cursor-pointer select-none active:scale-90 transition-transform"
          onClick={handlePetMascot}
        >
          <img
            className="w-11 h-11 object-contain"
            src={getActiveMascotUrl()}
            alt="Mascot"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-xs text-primary">
              {getMascotName()}
            </h3>
            <span className="text-[8px] bg-secondary-container/50 text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
              {getMascotMood()}
            </span>
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center justify-between text-[8px] font-bold text-on-surface-variant">
              <span>Level {mascotLevel}</span>
              <span>{mascotXP} / 1000 XP</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Study Mate Chat */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-3.5 border border-surface-variant/30 min-h-[180px] bubbly-shadow shrink-0">
        <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block mb-2 select-none">
          울리니 AI 스터디 메이트
        </span>
        <div
          ref={chatViewRef}
          className="flex-1 bg-surface-container-low rounded-xl p-2.5 border border-surface-variant/20 overflow-y-auto custom-scrollbar flex flex-col gap-2 max-h-[160px]"
        >
          {chatMessages.length === 0 ? (
            <p className="text-[9px] text-on-surface-variant/50 italic text-center my-auto select-none">
              마스코트를 쓰다듬거나 질문을 보내보세요! 🐾
            </p>
          ) : (
            chatMessages.map((msg) =>
              msg.sender === "user" ? (
                <div
                  key={msg.id}
                  className="flex gap-2 items-start justify-end"
                >
                  <div className="bg-primary text-white px-3 py-1.5 rounded-xl rounded-tr-none text-xs leading-normal max-w-[80%]">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                    <img
                      className="w-5 h-5 object-contain"
                      src={getActiveMascotUrl()}
                      alt="Mascot"
                    />
                  </div>
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    <div className="bg-secondary/10 text-on-secondary-container px-3 py-1.5 rounded-xl rounded-tl-none text-xs leading-normal w-full">
                      {msg.text}
                    </div>
                    {msg.proposedPlan && msg.proposedPlan.length > 0 && (
                      <div className="bg-surface-container-low border border-surface-variant/40 rounded-xl p-3 flex flex-col gap-2 bubbly-shadow mt-1 text-on-surface">
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1 select-none">
                          <span className="material-symbols-outlined text-xs">auto_awesome</span>
                          💡 AI 추천 학습 계획
                        </span>
                        
                        <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                          {msg.proposedPlan.map((item, idx) => (
                            <div key={idx} className="bg-surface-container-highest/50 border border-surface-variant/25 rounded-lg p-2 flex flex-col gap-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-on-surface-variant">{item.date}</span>
                                <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{item.duration}</span>
                              </div>
                              <span className="text-xs font-bold text-on-surface">{item.title}</span>
                              {item.content && (
                                <span className="text-[9px] text-on-surface-variant/85 leading-normal">{item.content}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {msg.planStatus === "pending" && (
                          <div className="flex gap-1.5 mt-1 pt-1.5 border-t border-surface-variant/10">
                            <button
                              onClick={() => handleAcceptPlan(msg.id, msg.proposedPlan!)}
                              className="flex-1 py-1 bg-primary text-white text-[9px] font-bold rounded-lg active:scale-95 transition-all cursor-pointer text-center"
                            >
                              추가하기
                            </button>
                            <button
                              onClick={() => handleEditPlan(msg.id)}
                              className="flex-1 py-1 border border-primary text-primary hover:bg-primary/5 text-[9px] font-bold rounded-lg active:scale-95 transition-all cursor-pointer text-center"
                            >
                              수정하기
                            </button>
                            <button
                              onClick={() => handleCancelPlan(msg.id)}
                              className="py-1 px-2.5 bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high text-[9px] font-bold rounded-lg active:scale-95 transition-all cursor-pointer text-center"
                            >
                              취소하기
                            </button>
                          </div>
                        )}

                        {msg.planStatus === "added" && (
                          <div className="text-center text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 py-1 rounded-lg mt-1 select-none border border-emerald-500/10">
                            ✅ 플래너에 등록되었습니다!
                          </div>
                        )}

                        {msg.planStatus === "cancelled" && (
                          <div className="text-center text-[9px] font-bold text-on-surface-variant/60 bg-surface-container-high py-1 rounded-lg mt-1 select-none border border-surface-variant/10">
                            ❌ 계획 등록이 취소되었습니다.
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

      {/* Mascot Selection */}
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
              <img
                className={`w-7 h-7 object-contain ${
                  m.key === "custom" ? "rounded-full" : ""
                }`}
                src={m.src}
                alt={m.label}
              />
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
            <button
              onClick={handleSaveCustomImage}
              className="px-3 py-1.5 bg-primary text-white text-[9px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              등록
            </button>
          </div>
          <div className="flex justify-between items-center gap-1.5 border-t border-dashed border-surface-variant/10 pt-1.5">
            <span className="text-on-surface-variant/60 font-semibold pl-1">
              또는 로컬 사진 파일 업로드:
            </span>
            <label className="px-3 py-1 bg-secondary text-white text-[9px] font-bold rounded-xl cursor-pointer hover:bg-secondary/95 transition-colors shrink-0 text-center select-none active:scale-95">
              <span>사진 선택</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomMascotUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
