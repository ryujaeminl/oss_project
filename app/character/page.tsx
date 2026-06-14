"use client";

import React, { useMemo, useRef, useState } from "react";
import { useApp, type AppSettings } from "@/lib/AppContext";

type MascotKey = AppSettings["activeMascot"];
type ClothingSlot = "head" | "face" | "neck" | "body" | "back" | "feet";
type TabKey = "home" | "shop" | "storage" | "ask";
type ShopKind = "furniture" | "clothing" | "wallpaper";
type FurnitureKind = "bed" | "desk" | "sofa" | "lamp" | "shelf" | "rug";

type WallpaperItem = {
  id: string;
  name: string;
  price: number;
  color: string;
  previewColor: string;
};

const WALLPAPER_CATALOG: WallpaperItem[] = [
  { id: "wall-default", name: "기본 세이지 벽지", price: 0, color: "#e8ffd9", previewColor: "#e8ffd9" },
  { id: "wall-peach", name: "달콤 피치 벽지", price: 50, color: "#ffe5ec", previewColor: "#ffe5ec" },
  { id: "wall-sky", name: "스카이 블루 벽지", price: 100, color: "#e0f2fe", previewColor: "#e0f2fe" },
  { id: "wall-purple", name: "라벤더 드림 벽지", price: 150, color: "#f3e8ff", previewColor: "#f3e8ff" },
  { id: "wall-lemon", name: "레몬 에이드 벽지", price: 120, color: "#fef9c3", previewColor: "#fef9c3" },
  { id: "wall-dark", name: "시크 그레이 벽지", price: 200, color: "#374151", previewColor: "#374151" },
];
type ClothingKind = "beret" | "glasses" | "scarf" | "hoodie" | "bag" | "boots";

type FurnitureItem = {
  id: string;
  name: string;
  price: number;
  kind: FurnitureKind;
  width: number;
  height: number;
  defaultX: number;
  defaultY: number;
};

type ClothingItem = {
  id: string;
  name: string;
  price: number;
  slot: ClothingSlot;
  kind: ClothingKind;
};

type ChatMessage = {
  id: number;
  sender: "user" | "assistant";
  text: string;
};

const MASCOT_IMAGES: Record<MascotKey, string> = {
  woolini:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAL7pl4zo3S5ns-o-IQp1FW_FNeH4JNl2e17Y55WQLVloGJWyPd9QAaITZh2aNHwLGSRJpYy16uKevBs3ccUc5ETPxrfb6pJRBKDOVdkCMxiWAGIw-E3Q_XXrJLvxGrWezytHz_Rmj9b5X2W3oSH7xeGEHGjhym1K5ZETUK8Fo4iWuIv0I-49l5_TYd8eaVQdaWkirZYUv7cKL9mYiqSqG530T6nJwVlZ6hHncdvTO_FEHUkxUEfJUhol9P7Vp11o3PPhzgGDp2Rj8",
  "yang-i": "https://img.icons8.com/color/150/sheep.png",
  "gom-i": "https://img.icons8.com/color/150/teddy-bear.png",
  custom: "https://img.icons8.com/color/150/user.png",
};

const FURNITURE_CATALOG: FurnitureItem[] = [
  { id: "cream-bed", name: "크림 원목 침대", price: 0, kind: "bed", width: 132, height: 88, defaultX: 72, defaultY: 66 },
  { id: "study-desk", name: "집중 공부 책상", price: 0, kind: "desk", width: 126, height: 94, defaultX: 28, defaultY: 48 },
  { id: "mint-sofa", name: "민트 패브릭 소파", price: 0, kind: "sofa", width: 126, height: 82, defaultX: 72, defaultY: 48 },
  { id: "sprout-lamp", name: "새싹 플로어 램프", price: 0, kind: "lamp", width: 62, height: 118, defaultX: 18, defaultY: 62 },
  { id: "book-shelf", name: "낮은 책장", price: 0, kind: "shelf", width: 116, height: 112, defaultX: 26, defaultY: 37 },
  { id: "round-rug", name: "포근 원형 러그", price: 0, kind: "rug", width: 156, height: 86, defaultX: 48, defaultY: 76 },
];

const CLOTHING_CATALOG: ClothingItem[] = [
  { id: "sage-beret", name: "세이지 베레모", price: 0, slot: "head", kind: "beret" },
  { id: "round-glasses", name: "동글 안경", price: 0, slot: "face", kind: "glasses" },
  { id: "peach-scarf", name: "복숭아 목도리", price: 0, slot: "neck", kind: "scarf" },
  { id: "study-hoodie", name: "공부 후드티", price: 0, slot: "body", kind: "hoodie" },
  { id: "mini-bag", name: "미니 크로스백", price: 0, slot: "back", kind: "bag" },
  { id: "cream-boots", name: "크림 부츠", price: 0, slot: "feet", kind: "boots" },
];

const SLOT_LABELS: Record<ClothingSlot, string> = {
  head: "머리",
  face: "얼굴",
  neck: "목",
  body: "몸",
  back: "가방",
  feet: "발",
};

export default function CharacterPage() {
  const {
    settings,
    updateSettings,
    mascotXP,
    mascotLevel,
    spendXP,
    addXP,
    ownedFurniture,
    setOwnedFurniture,
    roomFurniture,
    setRoomFurniture,
    ownedClothing,
    setOwnedClothing,
    equippedClothing,
    setEquippedClothing,
    ownedWallpapers,
    setOwnedWallpapers,
  } = useApp();

  const [tab, setTab] = useState<TabKey>("home");
  const [shopKind, setShopKind] = useState<ShopKind>("furniture");
  const [editMode, setEditMode] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
  const [pettingEffect, setPettingEffect] = useState(false);
  const [floatingText, setFloatingText] = useState<{ id: number; x: number; y: number }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "assistant",
      text: "모르는 문제를 그대로 적어줘. 풀이 힌트부터 단계별 설명까지 같이 정리해줄게.",
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  const roomRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string | null }>({ id: null });

  const activeMascot = settings.activeMascot || "woolini";
  const mascotUrl =
    activeMascot === "custom"
      ? settings.customMascotUrl || MASCOT_IMAGES.custom
      : MASCOT_IMAGES[activeMascot] || MASCOT_IMAGES.woolini;

  const ownedFurnitureSet = useMemo(() => new Set(ownedFurniture), [ownedFurniture]);
  const ownedClothingSet = useMemo(() => new Set(ownedClothing), [ownedClothing]);
  const ownedWallpapersSet = useMemo(() => new Set(ownedWallpapers), [ownedWallpapers]);

  const updateFurnitureScale = (id: string, newScale: number) => {
    setRoomFurniture((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, scale: Math.max(0.5, Math.min(2.0, parseFloat(newScale.toFixed(1)))) } : item
      )
    );
  };

  const buyWallpaper = (item: WallpaperItem) => {
    if (ownedWallpapersSet.has(item.id)) return;
    if (item.price > 0 && !spendXP(item.price)) {
      alert("XP가 부족해요. 공부를 완료해서 XP를 모아주세요.");
      return;
    }
    setOwnedWallpapers((prev) => [...prev, item.id]);
    updateSettings({ activeWallpaper: item.id });
  };

  const handlePetCharacter = (e: React.MouseEvent<HTMLDivElement>) => {
    addXP(3);
    setPettingEffect(true);
    setTimeout(() => setPettingEffect(false), 200);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newId = Date.now();
    setFloatingText((prev) => [...prev, { id: newId, x, y }]);
    setTimeout(() => {
      setFloatingText((prev) => prev.filter((item) => item.id !== newId));
    }, 1000);
  };

  const getFurniture = (id: string) => FURNITURE_CATALOG.find((item) => item.id === id);
  const getClothing = (id?: string) => CLOTHING_CATALOG.find((item) => item.id === id);

  const equippedItems = Object.values(equippedClothing)
    .map((id) => getClothing(id))
    .filter(Boolean) as ClothingItem[];

  const clampPosition = (x: number, y: number) => ({
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(86, Math.max(24, y)),
  });

  const pointToRoomPosition = (clientX: number, clientY: number) => {
    const room = roomRef.current;
    if (!room) return { x: 50, y: 58 };
    const rect = room.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return clampPosition(x, y);
  };

  const updateFurniturePosition = (id: string, x: number, y: number) => {
    setRoomFurniture((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x, y } : item))
    );
  };

  const handleFurniturePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    furnitureId: string
  ) => {
    if (!editMode) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current.id = furnitureId;
    setSelectedFurniture(furnitureId);
  };

  const handleRoomPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const draggingId = dragRef.current.id;
    if (!draggingId) return;
    const { x, y } = pointToRoomPosition(e.clientX, e.clientY);
    updateFurniturePosition(draggingId, x, y);
  };

  const stopFurnitureDrag = () => {
    dragRef.current.id = null;
  };

  const buyFurniture = (item: FurnitureItem) => {
    if (ownedFurnitureSet.has(item.id)) return;
    if (item.price > 0 && !spendXP(item.price)) {
      alert("XP가 부족해요. 공부를 완료해서 XP를 모아주세요.");
      return;
    }
    setOwnedFurniture((prev) => [...prev, item.id]);
    setRoomFurniture((prev) => [
      ...prev,
      {
        id: `${item.id}-${Date.now()}`,
        itemId: item.id,
        x: item.defaultX,
        y: item.defaultY,
      },
    ]);
    setEditMode(true);
  };

  const buyClothing = (item: ClothingItem) => {
    if (ownedClothingSet.has(item.id)) return;
    if (item.price > 0 && !spendXP(item.price)) {
      alert("XP가 부족해요. 공부를 완료해서 XP를 모아주세요.");
      return;
    }
    setOwnedClothing((prev) => [...prev, item.id]);
    setEquippedClothing((prev) => ({ ...prev, [item.slot]: item.id }));
  };

  const toggleClothing = (item: ClothingItem) => {
    setEquippedClothing((prev) => ({
      ...prev,
      [item.slot]: prev[item.slot] === item.id ? undefined : item.id,
    }));
  };

  const placeFurnitureFromStorage = (item: FurnitureItem) => {
    setRoomFurniture((prev) => [
      ...prev,
      {
        id: `${item.id}-${Date.now()}`,
        itemId: item.id,
        x: item.defaultX,
        y: item.defaultY,
      },
    ]);
    setEditMode(true);
    setTab("home");
  };

  const removeFurniture = (id: string) => {
    setRoomFurniture((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length === 0) {
        setEditMode(false);
      }
      return next;
    });
    if (selectedFurniture === id) setSelectedFurniture(null);
  };

  const sendQuestion = async () => {
    const text = chatInput.trim();
    if (!text || isAsking) return;

    const userMessage: ChatMessage = { id: Date.now(), sender: "user", text };
    const history = chatMessages.map((message) => ({
      role: message.sender === "user" ? "user" : "model",
      parts: [message.text],
    }));

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `모르는 문제 질문이야. 정답만 말하지 말고 풀이 과정, 핵심 개념, 비슷한 문제를 풀 때의 요령까지 설명해줘.\n\n${text}`,
          history,
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      const reply =
        data.reply ||
        data.error ||
        "지금은 답변을 가져오지 못했어. 로그인 상태와 Gemini API 키 설정을 확인해줘.";

      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "assistant", text: reply },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "assistant",
          text: "연결에 실패했어. 잠시 후 다시 질문해줘.",
        },
      ]);
    } finally {
      setIsAsking(false);
      window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    }
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-[#e4fbd4] text-on-surface">
      <div
        ref={roomRef}
        className="relative h-full min-h-[650px] overflow-hidden"
        onPointerMove={handleRoomPointerMove}
        onPointerUp={stopFurnitureDrag}
        onPointerCancel={stopFurnitureDrag}
      >
        <RoomBackground wallpaperId={settings.activeWallpaper} />

        <div className="absolute left-5 top-7 z-30 rounded-full bg-white/95 px-4 py-2 text-xs font-extrabold text-[#3f6b31] shadow-md">
          ♥ 포근한 기분
        </div>
        <div className="absolute right-5 top-7 z-30 rounded-full bg-white/95 px-3 py-2 text-[11px] font-extrabold text-[#3f6b31] shadow-md">
          Lv.{mascotLevel} · {mascotXP} XP
        </div>

        {roomFurniture.map((placed) => {
          const item = getFurniture(placed.itemId);
          if (!item) return null;
          const isSelected = selectedFurniture === placed.id;
          return (
            <button
              key={placed.id}
              type="button"
              onPointerDown={(e) => handleFurniturePointerDown(e, placed.id)}
              onClick={() => {
                if (editMode) setSelectedFurniture(placed.id);
              }}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 touch-none select-none transition ${
                editMode ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              } ${isSelected ? "rounded-3xl ring-4 ring-[#44783f]/35" : ""}`}
              style={{
                left: `${placed.x}%`,
                top: `${placed.y}%`,
                width: item.width * (placed.scale || 1),
                height: item.height * (placed.scale || 1),
              }}
              aria-label={`${item.name} 이동`}
            >
              <FurnitureModel item={item} selected={isSelected} />
            </button>
          );
        })}

        <div
          onClick={handlePetCharacter}
          className={`absolute left-1/2 top-[44%] z-20 h-[310px] w-[260px] -translate-x-1/2 cursor-pointer transition-all duration-200 select-none ${
            pettingEffect ? "scale-90" : "hover:scale-[1.03] active:scale-95"
          }`}
        >
          <div className="absolute left-1/2 top-[61%] h-20 w-40 -translate-x-1/2 rounded-[50%] bg-[#5b7348]/15 blur-md" />
          <img
            src={mascotUrl}
            alt="울리니 캐릭터"
            className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-2xl"
            draggable={false}
          />
          {equippedItems.map((item) => (
            <ClothingLayer key={item.id} item={item} />
          ))}

          {/* Floating effects */}
          {floatingText.map((t) => (
            <span
              key={t.id}
              className="absolute animate-float-up pointer-events-none text-xs font-black text-[#3f6b31] bg-white/90 px-2 py-0.5 rounded-full shadow-md whitespace-nowrap"
              style={{ left: t.x, top: t.y }}
            >
              +3 XP ♥
            </span>
          ))}
        </div>

        <div className="absolute bottom-24 left-5 right-5 z-40 flex items-center justify-between pointer-events-none">
          <div className="rounded-full bg-white/95 px-4 py-2.5 text-[10px] font-black text-[#3f6b31] shadow-md border border-[#d8e7d1]/80 select-none animate-pulse">
            👉 울리니를 터치해 쓰다듬어주세요! (+3XP)
          </div>
          <button
            type="button"
            onClick={() => {
              if (roomFurniture.length === 0) {
                alert("배치된 가구가 없습니다. 먼저 보관함이나 상점에서 가구를 배치해주세요!");
                return;
              }
              setEditMode((prev) => !prev);
            }}
            className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition ${
              editMode ? "bg-[#ba1a1a]" : "bg-[#3f6b31]"
            }`}
            aria-label="방 편집"
          >
            <span className="material-symbols-outlined text-3xl">{editMode ? "check" : "edit"}</span>
          </button>
        </div>

        {editMode && selectedFurniture && (
          <div className="absolute bottom-40 left-1/2 z-40 -translate-x-1/2 flex flex-col items-center gap-2 select-none">
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-lg border border-[#d8e7d1]">
              <button
                type="button"
                onClick={() => {
                  const placed = roomFurniture.find((f) => f.id === selectedFurniture);
                  if (placed) {
                    const currentScale = placed.scale || 1;
                    updateFurnitureScale(selectedFurniture, currentScale - 0.1);
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf8e5] text-[#3f6b31] font-bold text-lg active:scale-95 cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-extrabold text-[#3f6b31] w-12 text-center">
                {Math.round((roomFurniture.find((f) => f.id === selectedFurniture)?.scale || 1) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  const placed = roomFurniture.find((f) => f.id === selectedFurniture);
                  if (placed) {
                    const currentScale = placed.scale || 1;
                    updateFurnitureScale(selectedFurniture, currentScale + 0.1);
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf8e5] text-[#3f6b31] font-bold text-lg active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeFurniture(selectedFurniture)}
              className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-error shadow-lg border border-red-100 cursor-pointer hover:bg-red-50 transition-colors"
            >
              선택한 가구 치우기
            </button>
          </div>
        )}

        {tab === "shop" && (
          <Panel title="상점" onClose={() => setTab("home")}>
            <div className="mb-3 flex rounded-full bg-[#edf8e5] p-1">
              <SegmentButton active={shopKind === "furniture"} onClick={() => setShopKind("furniture")}>
                가구
              </SegmentButton>
              <SegmentButton active={shopKind === "clothing"} onClick={() => setShopKind("clothing")}>
                의상
              </SegmentButton>
              <SegmentButton active={shopKind === "wallpaper"} onClick={() => setShopKind("wallpaper")}>
                벽지
              </SegmentButton>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {shopKind === "furniture" &&
                FURNITURE_CATALOG.map((item) => {
                  const owned = ownedFurnitureSet.has(item.id);
                  return (
                    <ItemButton
                      key={item.id}
                      preview={<FurnitureModel item={item} compact />}
                      name={item.name}
                      meta={owned ? "보유중" : item.price > 0 ? `${item.price} XP` : "무료 구매"}
                      disabled={owned}
                      onClick={() => buyFurniture(item)}
                    />
                  );
                })}
              {shopKind === "clothing" &&
                CLOTHING_CATALOG.map((item) => {
                  const owned = ownedClothingSet.has(item.id);
                  return (
                    <ItemButton
                      key={item.id}
                      preview={<ClothingPreview item={item} />}
                      name={item.name}
                      meta={owned ? `${SLOT_LABELS[item.slot]} 보유` : item.price > 0 ? `${item.price} XP` : "무료 구매"}
                      disabled={owned}
                      onClick={() => buyClothing(item)}
                    />
                  );
                })}
              {shopKind === "wallpaper" &&
                WALLPAPER_CATALOG.map((item) => {
                  const owned = ownedWallpapersSet.has(item.id);
                  return (
                    <ItemButton
                      key={item.id}
                      preview={
                        <div
                          className="h-10 w-10 rounded-full border border-[#d8e7d1]/80 shadow-inner"
                          style={{ backgroundColor: item.previewColor }}
                        />
                      }
                      name={item.name}
                      meta={owned ? "보유중" : item.price > 0 ? `${item.price} XP` : "무료 구매"}
                      disabled={owned}
                      onClick={() => buyWallpaper(item)}
                    />
                  );
                })}
            </div>
          </Panel>
        )}

        {tab === "storage" && (
          <Panel title="보관함" onClose={() => setTab("home")}>
            <p className="mb-3 text-[11px] font-bold text-on-surface-variant">
              가구는 방에 꺼낸 다음 편집 모드에서 직접 드래그하세요. 옷은 누르면 바로 울리니에게 입혀집니다.
            </p>
            <StorageSection title="옷">
              {ownedClothing.length === 0 ? (
                <EmptyBox label="상점에서 옷을 구매해 주세요." />
              ) : (
                ownedClothing.map((id) => {
                  const item = getClothing(id);
                  if (!item) return null;
                  const equipped = equippedClothing[item.slot] === item.id;
                  return (
                    <ItemButton
                      key={item.id}
                      preview={<ClothingPreview item={item} />}
                      name={item.name}
                      meta={equipped ? "착용중" : `${SLOT_LABELS[item.slot]} 착용`}
                      active={equipped}
                      onClick={() => toggleClothing(item)}
                    />
                  );
                })
              )}
            </StorageSection>
            <StorageSection title="가구">
              {ownedFurniture.length === 0 ? (
                <EmptyBox label="상점에서 가구를 구매해 주세요." />
              ) : (
                ownedFurniture.map((id) => {
                  const item = getFurniture(id);
                  if (!item) return null;
                  return (
                    <ItemButton
                      key={item.id}
                      preview={<FurnitureModel item={item} compact />}
                      name={item.name}
                      meta="방에 추가 배치"
                      onClick={() => placeFurnitureFromStorage(item)}
                    />
                  );
                })
              )}
            </StorageSection>
            <StorageSection title="벽지">
              {ownedWallpapers.length === 0 ? (
                <EmptyBox label="상점에서 벽지를 구매해 주세요." />
              ) : (
                ownedWallpapers.map((id) => {
                  const item = WALLPAPER_CATALOG.find((w) => w.id === id);
                  if (!item) return null;
                  const isActive = settings.activeWallpaper === item.id;
                  return (
                    <ItemButton
                      key={item.id}
                      preview={
                        <div
                          className="h-10 w-10 rounded-full border border-[#d8e7d1]/80 shadow-inner"
                          style={{ backgroundColor: item.previewColor }}
                        />
                      }
                      name={item.name}
                      meta={isActive ? "적용중" : "벽지 적용"}
                      active={isActive}
                      onClick={() => updateSettings({ activeWallpaper: item.id })}
                    />
                  );
                })
              )}
            </StorageSection>
          </Panel>
        )}

        <style>{`
          @keyframes floatUp {
            0% { transform: translateY(0) scale(0.8); opacity: 1; }
            100% { transform: translateY(-70px) scale(1.18); opacity: 0; }
          }
          .animate-float-up {
            animation: floatUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {tab === "ask" && (
          <Panel title="질문하기" onClose={() => setTab("home")} tall>
            <div className="flex h-[330px] flex-col">
              <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto rounded-2xl bg-[#f7fff3] p-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        message.sender === "user"
                          ? "rounded-br-sm bg-[#3f6b31] text-white"
                          : "rounded-bl-sm bg-white text-on-surface shadow-sm"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isAsking && (
                  <div className="w-fit rounded-2xl bg-white px-3 py-2 text-xs font-bold text-on-surface-variant shadow-sm">
                    제미나이가 풀이를 생각하는 중...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="mt-3 flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendQuestion();
                    }
                  }}
                  placeholder="문제 사진 내용을 적거나, 막힌 풀이 과정을 질문해 주세요."
                  className="min-h-12 flex-1 resize-none rounded-2xl border border-[#d8e7d1] bg-white px-3 py-2 text-xs text-on-surface outline-none focus:border-[#3f6b31]"
                />
                <button
                  type="button"
                  onClick={sendQuestion}
                  disabled={isAsking}
                  className="h-12 w-12 rounded-2xl bg-[#3f6b31] text-white shadow-md disabled:opacity-50"
                  aria-label="질문 보내기"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
            </div>
          </Panel>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-50 grid h-20 grid-cols-4 rounded-t-[28px] bg-[#dcffd0]/95 px-4 py-2 shadow-[0_-8px_22px_rgba(63,107,49,0.08)] backdrop-blur">
          <TabButton active={tab === "home"} icon="home" label="홈" onClick={() => setTab("home")} />
          <TabButton active={tab === "shop"} icon="shopping_bag" label="상점" onClick={() => setTab("shop")} />
          <TabButton active={tab === "storage"} icon="inventory_2" label="보관함" onClick={() => setTab("storage")} />
          <TabButton active={tab === "ask"} icon="chat" label="질문" onClick={() => setTab("ask")} />
        </div>
      </div>
    </div>
  );
}

function RoomBackground({ wallpaperId }: { wallpaperId?: string }) {
  const wallpaper = WALLPAPER_CATALOG.find((w) => w.id === wallpaperId) || WALLPAPER_CATALOG[0];
  return (
    <>
      <div
        className="absolute inset-0 transition-colors duration-300"
        style={{
          background: `linear-gradient(180deg, ${wallpaper.color} 0%, ${wallpaper.color} 52%, #fff7ef 52%, #fff7ef 100%)`,
        }}
      />
      <div className="absolute inset-x-0 top-[52%] h-px bg-[#eadfd5]" />
      <div className="absolute inset-x-0 bottom-20 grid h-[42%] grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={index} className="border-r border-[#eadfd5]/80 last:border-r-0" />
        ))}
      </div>
      <div className="absolute left-[11%] top-[70%] h-16 w-48 -translate-y-1/2 rounded-[50%] bg-[#ead681]/35 blur-sm" />
    </>
  );
}

function FurnitureModel({
  item,
  compact = false,
  selected = false,
}: {
  item: FurnitureItem;
  compact?: boolean;
  selected?: boolean;
}) {
  const scale = compact ? "scale-[0.58]" : "";
  return (
    <div className={`relative h-full w-full ${scale}`} aria-hidden="true">
      {item.kind === "bed" && (
        <div className="absolute inset-x-1 bottom-2 h-[70%]">
          <div className="absolute bottom-0 left-1 right-1 h-[54%] rounded-[22px] bg-[#f2c99c] shadow-[inset_0_-8px_0_rgba(150,90,45,0.18),0_10px_18px_rgba(90,62,38,0.16)]" />
          <div className="absolute bottom-[33%] left-3 right-3 h-[45%] rounded-[24px] bg-[#fff3df] shadow-inner" />
          <div className="absolute left-5 top-0 h-[34%] w-[35%] rounded-2xl bg-white shadow-md" />
          <div className="absolute right-5 top-1 h-[30%] w-[30%] rounded-2xl bg-[#d7efca] shadow-md" />
          <div className="absolute bottom-0 left-2 h-5 w-3 rounded-b bg-[#8a5d35]" />
          <div className="absolute bottom-0 right-2 h-5 w-3 rounded-b bg-[#8a5d35]" />
        </div>
      )}
      {item.kind === "desk" && (
        <div className="absolute inset-x-1 bottom-1 h-[86%]">
          <div className="absolute left-2 top-2 h-[44%] w-[42%] rounded-t-2xl bg-[#d7efca] shadow-md" />
          <div className="absolute right-4 top-0 h-[42%] w-[24%] rounded-t-xl bg-[#f7e5bc] shadow-md" />
          <div className="absolute bottom-[31%] left-0 right-0 h-[18%] rounded-xl bg-[#b47a46] shadow-[inset_0_-6px_0_rgba(80,45,20,0.2)]" />
          <div className="absolute bottom-0 left-5 h-[38%] w-3 rounded-b bg-[#7a4d2b]" />
          <div className="absolute bottom-0 right-5 h-[38%] w-3 rounded-b bg-[#7a4d2b]" />
          <div className="absolute bottom-[51%] left-4 h-4 w-12 rounded bg-white/85" />
        </div>
      )}
      {item.kind === "sofa" && (
        <div className="absolute inset-x-1 bottom-2 h-[72%]">
          <div className="absolute bottom-[26%] left-2 right-2 h-[52%] rounded-t-[26px] bg-[#a9d99f] shadow-lg" />
          <div className="absolute bottom-[22%] left-0 h-[42%] w-[25%] rounded-[22px] bg-[#95ca8a]" />
          <div className="absolute bottom-[22%] right-0 h-[42%] w-[25%] rounded-[22px] bg-[#95ca8a]" />
          <div className="absolute bottom-0 left-2 right-2 h-[36%] rounded-[24px] bg-[#bee7b6] shadow-[inset_0_-8px_0_rgba(75,130,66,0.16)]" />
          <div className="absolute bottom-0 left-7 h-4 w-3 rounded-b bg-[#6b4a2d]" />
          <div className="absolute bottom-0 right-7 h-4 w-3 rounded-b bg-[#6b4a2d]" />
        </div>
      )}
      {item.kind === "lamp" && (
        <div className="absolute inset-x-1 bottom-0 h-full">
          <div className="absolute bottom-0 left-1/2 h-3 w-[58%] -translate-x-1/2 rounded-[50%] bg-[#7b5f35]" />
          <div className="absolute bottom-2 left-1/2 h-[58%] w-2 -translate-x-1/2 rounded bg-[#8d744c]" />
          <div className="absolute bottom-[57%] left-1/2 h-[32%] w-[62%] -translate-x-1/2 rounded-t-[40px] rounded-b-xl bg-[#fff0a8] shadow-[0_0_24px_rgba(255,223,116,0.55)]" />
          <div className="absolute bottom-[83%] left-[49%] h-6 w-8 rounded-full bg-[#9ad082]" />
          <div className="absolute bottom-[80%] left-[30%] h-5 w-8 -rotate-35 rounded-full bg-[#9ad082]" />
        </div>
      )}
      {item.kind === "shelf" && (
        <div className="absolute inset-x-1 bottom-1 h-[88%] rounded-2xl bg-[#c89562] p-2 shadow-[inset_0_-8px_0_rgba(95,54,24,0.18),0_8px_16px_rgba(90,62,38,0.14)]">
          <div className="grid h-full grid-rows-3 gap-2">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-end gap-1 rounded-lg bg-[#f3d3a8] px-2 pb-1">
                <span className="h-8 w-3 rounded-sm bg-[#8dbd82]" />
                <span className="h-6 w-3 rounded-sm bg-[#f5efcf]" />
                <span className="h-7 w-3 rounded-sm bg-[#d69898]" />
                <span className="ml-auto h-5 w-5 rounded-full bg-white/70" />
              </div>
            ))}
          </div>
        </div>
      )}
      {item.kind === "rug" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[72%] w-[92%] rounded-[50%] bg-[radial-gradient(circle,#fff3bd_0%,#f2d988_58%,#e1c26a_100%)] shadow-[0_12px_20px_rgba(130,100,30,0.12)]" />
          <div className="absolute h-[45%] w-[65%] rounded-[50%] border-2 border-white/45" />
        </div>
      )}
      {selected && <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-[#3f6b31]" />}
    </div>
  );
}

function ClothingLayer({ item }: { item: ClothingItem }) {
  if (item.kind === "beret") {
    return (
      <div className="pointer-events-none absolute left-[50%] top-[12%] z-30 h-12 w-24 -translate-x-1/2 -rotate-6 rounded-[50%] bg-[#5f8d55] shadow-[inset_0_-7px_0_rgba(39,83,48,0.22),0_5px_10px_rgba(0,0,0,0.12)]">
        <span className="absolute left-[45%] top-[-7px] h-4 w-4 rounded-full bg-[#76a66b]" />
      </div>
    );
  }
  if (item.kind === "glasses") {
    return (
      <div className="pointer-events-none absolute left-1/2 top-[35%] z-30 h-9 w-28 -translate-x-1/2">
        <span className="absolute left-2 top-1 h-8 w-8 rounded-full border-[5px] border-[#332f39] bg-white/10" />
        <span className="absolute right-2 top-1 h-8 w-8 rounded-full border-[5px] border-[#332f39] bg-white/10" />
        <span className="absolute left-[45%] top-5 h-1 w-7 rounded-full bg-[#332f39]" />
      </div>
    );
  }
  if (item.kind === "scarf") {
    return (
      <div className="pointer-events-none absolute left-1/2 top-[49%] z-30 h-12 w-32 -translate-x-1/2">
        <span className="absolute left-2 right-2 top-1 h-7 rounded-full bg-[#f4a28e] shadow-[inset_0_-5px_0_rgba(190,88,70,0.18)]" />
        <span className="absolute right-9 top-6 h-16 w-7 rotate-12 rounded-b-2xl bg-[#f4a28e] shadow-md" />
      </div>
    );
  }
  if (item.kind === "hoodie") {
    return (
      <div className="pointer-events-none absolute left-1/2 top-[55%] z-30 h-28 w-36 -translate-x-1/2">
        <span className="absolute left-3 right-3 top-0 h-16 rounded-t-[38px] bg-[#6fae82] opacity-95 shadow-[inset_0_-8px_0_rgba(55,113,72,0.22)]" />
        <span className="absolute left-2 top-10 h-12 w-8 -rotate-35 rounded-full bg-[#6fae82]" />
        <span className="absolute right-2 top-10 h-12 w-8 rotate-35 rounded-full bg-[#6fae82]" />
        <span className="absolute left-1/2 top-7 h-8 w-10 -translate-x-1/2 rounded-b-2xl bg-[#f6df9b]" />
      </div>
    );
  }
  if (item.kind === "bag") {
    return (
      <div className="pointer-events-none absolute left-[61%] top-[54%] z-40 h-20 w-20">
        <span className="absolute left-0 top-0 h-16 w-3 -rotate-35 rounded-full bg-[#835b45]" />
        <span className="absolute bottom-0 right-1 h-12 w-12 rounded-2xl bg-[#e7bf76] shadow-[inset_0_-6px_0_rgba(151,95,38,0.18)]" />
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute left-1/2 top-[76%] z-30 h-12 w-28 -translate-x-1/2">
      <span className="absolute left-4 top-3 h-8 w-9 rounded-b-2xl rounded-t-lg bg-[#f2d69a] shadow-md" />
      <span className="absolute right-4 top-3 h-8 w-9 rounded-b-2xl rounded-t-lg bg-[#f2d69a] shadow-md" />
    </div>
  );
}

function ClothingPreview({ item }: { item: ClothingItem }) {
  return (
    <div className="relative h-14 w-14 rounded-2xl bg-[#edf8e5]">
      <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b8d995]" />
      <div className="absolute inset-0 scale-[0.45]">
        <ClothingLayer item={item} />
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-full text-[11px] font-extrabold transition ${
        active ? "bg-[#aee894] text-[#3f6b31]" : "text-[#4f5f4b]"
      }`}
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      {label}
    </button>
  );
}

function SegmentButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-xs font-extrabold ${
        active ? "bg-white text-[#3f6b31] shadow" : "text-[#6d8066]"
      }`}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  children,
  onClose,
  tall,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  tall?: boolean;
}) {
  return (
    <div
      className={`absolute inset-x-4 bottom-24 z-50 overflow-y-auto rounded-3xl border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur ${
        tall ? "max-h-[62%]" : "max-h-[50%]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-extrabold text-[#3f6b31]">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-full bg-[#edf8e5] p-1.5">
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
      {children}
    </div>
  );
}

function StorageSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 last:mb-0">
      <h3 className="mb-2 text-xs font-extrabold text-[#3f6b31]">{title}</h3>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </section>
  );
}

function ItemButton({
  preview,
  name,
  meta,
  disabled,
  active,
  onClick,
}: {
  preview: React.ReactNode;
  name: string;
  meta: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-24 items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
        active
          ? "border-[#3f6b31] bg-[#e8ffd9]"
          : disabled
          ? "border-[#d8e7d1] bg-[#f4fbf0] opacity-75"
          : "border-[#d8e7d1] bg-white"
      }`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#edf8e5]">
        {preview}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-extrabold leading-snug text-on-surface">{name}</span>
        <span className="mt-1 block text-[10px] font-bold text-on-surface-variant">{meta}</span>
      </span>
    </button>
  );
}

function EmptyBox({ label }: { label: string }) {
  return (
    <div className="col-span-2 rounded-2xl bg-[#f4fbf0] p-4 text-center text-xs font-bold text-on-surface-variant">
      {label}
    </div>
  );
}
