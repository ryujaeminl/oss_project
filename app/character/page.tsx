"use client";

import React, { useMemo, useRef, useState } from "react";
import { useApp, type AppSettings } from "@/lib/AppContext";

type MascotKey = AppSettings["activeMascot"];
type ClothingSlot = "head" | "neck" | "body" | "hand";
type TabKey = "home" | "shop" | "storage";

type FurnitureItem = {
  id: string;
  name: string;
  price: number;
  emoji: string;
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
  emoji: string;
  className: string;
};

const MASCOT_IMAGES: Record<MascotKey, string> = {
  woolini:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAL7pl4zo3S5ns-o-IQp1FW_FNeH4JNl2e17Y55WQLVloGJWyPd9QAaITZh2aNHwLGSRJpYy16uKevBs3ccUc5ETPxrfb6pJRBKDOVdkCMxiWAGIw-E3Q_XXrJLvxGrWezytHz_Rmj9b5X2W3oSH7xeGEHGjhym1K5ZETUK8Fo4iWuIv0I-49l5_TYd8eaVQdaWkirZYUv7cKL9mYiqSqG530T6nJwVlZ6hHncdvTO_FEHUkxUEfJUhol9P7Vp11o3PPhzgGDp2Rj8",
  "yang-i": "https://img.icons8.com/color/150/sheep.png",
  "gom-i": "https://img.icons8.com/color/150/teddy-bear.png",
  custom: "https://img.icons8.com/color/150/user.png",
};

const FURNITURE_CATALOG: FurnitureItem[] = [
  { id: "soft-bed", name: "말랑 침대", price: 0, emoji: "🛏️", width: 92, height: 70, defaultX: 74, defaultY: 66 },
  { id: "round-table", name: "동글 테이블", price: 0, emoji: "🪑", width: 70, height: 64, defaultX: 27, defaultY: 68 },
  { id: "study-desk", name: "공부 책상", price: 0, emoji: "📚", width: 86, height: 66, defaultX: 23, defaultY: 45 },
  { id: "mood-lamp", name: "새싹 램프", price: 0, emoji: "💡", width: 50, height: 74, defaultX: 17, defaultY: 74 },
  { id: "mini-sofa", name: "폭신 소파", price: 0, emoji: "🛋️", width: 92, height: 62, defaultX: 74, defaultY: 47 },
  { id: "plant-friend", name: "화분 친구", price: 0, emoji: "🪴", width: 52, height: 70, defaultX: 18, defaultY: 78 },
];

const CLOTHING_CATALOG: ClothingItem[] = [
  { id: "leaf-hat", name: "잎사귀 모자", price: 0, slot: "head", emoji: "🌿", className: "left-1/2 top-[2%] -translate-x-1/2 text-4xl" },
  { id: "yellow-cap", name: "노랑 모자", price: 0, slot: "head", emoji: "🧢", className: "left-1/2 top-[3%] -translate-x-1/2 text-4xl" },
  { id: "pink-scarf", name: "복숭아 머플러", price: 0, slot: "neck", emoji: "🧣", className: "left-1/2 top-[43%] -translate-x-1/2 text-3xl" },
  { id: "green-vest", name: "초록 조끼", price: 0, slot: "body", emoji: "🦺", className: "left-1/2 top-[53%] -translate-x-1/2 text-4xl" },
  { id: "star-bag", name: "별 가방", price: 0, slot: "hand", emoji: "⭐", className: "right-[13%] top-[50%] text-3xl" },
  { id: "pencil-wand", name: "연필 지팡이", price: 0, slot: "hand", emoji: "✏️", className: "left-[14%] top-[51%] -rotate-45 text-3xl" },
];

const SLOT_LABELS: Record<ClothingSlot, string> = {
  head: "머리",
  neck: "목",
  body: "몸",
  hand: "손",
};

export default function CharacterPage() {
  const {
    settings,
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
  } = useApp();

  const [tab, setTab] = useState<TabKey>("home");
  const [shopKind, setShopKind] = useState<"furniture" | "clothing">("furniture");
  const [editMode, setEditMode] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string | null }>({ id: null });

  const activeMascot = settings.activeMascot || "woolini";
  const mascotUrl =
    activeMascot === "custom"
      ? settings.customMascotUrl || MASCOT_IMAGES.custom
      : MASCOT_IMAGES[activeMascot] || MASCOT_IMAGES.woolini;

  const ownedFurnitureSet = useMemo(() => new Set(ownedFurniture), [ownedFurniture]);
  const ownedClothingSet = useMemo(() => new Set(ownedClothing), [ownedClothing]);

  const clampPosition = (x: number, y: number) => ({
    x: Math.min(90, Math.max(10, x)),
    y: Math.min(84, Math.max(24, y)),
  });

  const getFurniture = (id: string) => FURNITURE_CATALOG.find((item) => item.id === id);
  const getClothing = (id?: string) => CLOTHING_CATALOG.find((item) => item.id === id);

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
    setRoomFurniture((prev) => prev.filter((item) => item.id !== id));
    if (selectedFurniture === id) setSelectedFurniture(null);
  };

  const givePat = () => {
    addXP(3);
  };

  const equippedItems = Object.values(equippedClothing)
    .map((id) => getClothing(id))
    .filter(Boolean) as ClothingItem[];

  return (
    <div className="relative flex-1 overflow-hidden bg-[#e8ffd9] text-on-surface">
      <div
        ref={roomRef}
        className="relative h-full min-h-[620px] overflow-hidden"
        onPointerMove={handleRoomPointerMove}
        onPointerUp={stopFurnitureDrag}
        onPointerCancel={stopFurnitureDrag}
      >
        <div className="absolute left-6 top-8 z-30 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold text-[#3f6b31] shadow-md">
          ♥ 포근한 기분
        </div>

        <div className="absolute inset-x-0 bottom-20 h-[47%] bg-[#fff7ef]" />
        <div className="absolute inset-x-0 bottom-20 grid h-[47%] grid-cols-4 border-t border-[#eadfd5]">
          {Array.from({ length: 4 }).map((_, index) => (
            <span key={index} className="border-r border-[#eadfd5]/80 last:border-r-0" />
          ))}
        </div>
        <div className="absolute left-8 top-[68%] h-16 w-44 -translate-y-1/2 rounded-[50%] bg-[#ead681]/35 blur-sm" />

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
              className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 touch-none select-none flex-col items-center justify-center rounded-2xl border bg-white/55 shadow-lg backdrop-blur-sm transition ${
                editMode ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              } ${isSelected ? "border-[#3f6b31] ring-4 ring-[#b9ee9b]/60" : "border-white/70"}`}
              style={{
                left: `${placed.x}%`,
                top: `${placed.y}%`,
                width: item.width,
                height: item.height,
              }}
              aria-label={`${item.name} 이동`}
            >
              <span className="text-3xl leading-none drop-shadow-sm">{item.emoji}</span>
              <span className="mt-1 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold text-[#496044]">
                {item.name}
              </span>
            </button>
          );
        })}

        <div className="absolute left-1/2 top-[42%] z-20 h-[300px] w-[260px] -translate-x-1/2">
          <img
            src={mascotUrl}
            alt="울리니 캐릭터"
            className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-2xl"
            draggable={false}
          />
          {equippedItems.map((item) => (
            <span
              key={item.id}
              className={`pointer-events-none absolute z-30 drop-shadow-md ${item.className}`}
              aria-hidden="true"
            >
              {item.emoji}
            </span>
          ))}
        </div>

        {editMode && selectedFurniture && (
          <button
            type="button"
            onClick={() => removeFurniture(selectedFurniture)}
            className="absolute bottom-28 left-1/2 z-40 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-error shadow-lg"
          >
            선택한 가구 치우기
          </button>
        )}

        <button
          type="button"
          onClick={() => setEditMode((prev) => !prev)}
          className={`absolute bottom-32 right-7 z-40 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl transition ${
            editMode ? "bg-[#ba1a1a]" : "bg-[#3f6b31]"
          }`}
          aria-label="방 편집"
        >
          <span className="material-symbols-outlined text-3xl">{editMode ? "check" : "edit"}</span>
        </button>

        <button
          type="button"
          onClick={givePat}
          className="absolute bottom-32 left-7 z-40 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold text-[#3f6b31] shadow-md"
        >
          쓰다듬기 +3XP
        </button>

        {tab === "shop" && (
          <Panel title="상점" onClose={() => setTab("home")}>
            <div className="mb-3 flex rounded-full bg-[#edf8e5] p-1">
              <button
                type="button"
                onClick={() => setShopKind("furniture")}
                className={`flex-1 rounded-full py-2 text-xs font-extrabold ${shopKind === "furniture" ? "bg-white text-[#3f6b31] shadow" : "text-[#6d8066]"}`}
              >
                가구 6종
              </button>
              <button
                type="button"
                onClick={() => setShopKind("clothing")}
                className={`flex-1 rounded-full py-2 text-xs font-extrabold ${shopKind === "clothing" ? "bg-white text-[#3f6b31] shadow" : "text-[#6d8066]"}`}
              >
                옷 6종
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {shopKind === "furniture"
                ? FURNITURE_CATALOG.map((item) => {
                    const owned = ownedFurnitureSet.has(item.id);
                    return (
                      <ShopButton
                        key={item.id}
                        icon={item.emoji}
                        name={item.name}
                        meta={owned ? "보유중" : item.price > 0 ? `${item.price} XP` : "무료 구매"}
                        disabled={owned}
                        onClick={() => buyFurniture(item)}
                      />
                    );
                  })
                : CLOTHING_CATALOG.map((item) => {
                    const owned = ownedClothingSet.has(item.id);
                    return (
                      <ShopButton
                        key={item.id}
                        icon={item.emoji}
                        name={item.name}
                        meta={owned ? `${SLOT_LABELS[item.slot]} 보유` : item.price > 0 ? `${item.price} XP` : "무료 구매"}
                        disabled={owned}
                        onClick={() => buyClothing(item)}
                      />
                    );
                  })}
            </div>
          </Panel>
        )}

        {tab === "storage" && (
          <Panel title="보관함" onClose={() => setTab("home")}>
            <p className="mb-3 text-[11px] font-bold text-on-surface-variant">
              옷은 울리니에게 바로 입히고, 가구는 방에 꺼낸 뒤 원하는 위치로 드래그하세요.
            </p>
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-extrabold text-[#3f6b31]">옷</h3>
              <div className="grid grid-cols-2 gap-2">
                {ownedClothing.length === 0 ? (
                  <EmptyBox label="상점에서 옷을 구매해 주세요." />
                ) : (
                  ownedClothing.map((id) => {
                    const item = getClothing(id);
                    if (!item) return null;
                    const equipped = equippedClothing[item.slot] === item.id;
                    return (
                      <ShopButton
                        key={item.id}
                        icon={item.emoji}
                        name={item.name}
                        meta={equipped ? "착용중" : `${SLOT_LABELS[item.slot]} 착용`}
                        active={equipped}
                        onClick={() => toggleClothing(item)}
                      />
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-extrabold text-[#3f6b31]">가구</h3>
              <div className="grid grid-cols-2 gap-2">
                {ownedFurniture.length === 0 ? (
                  <EmptyBox label="상점에서 가구를 구매해 주세요." />
                ) : (
                  ownedFurniture.map((id) => {
                    const item = getFurniture(id);
                    if (!item) return null;
                    return (
                      <ShopButton
                        key={item.id}
                        icon={item.emoji}
                        name={item.name}
                        meta="방에 배치"
                        onClick={() => placeFurnitureFromStorage(item)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </Panel>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-50 grid h-20 grid-cols-3 rounded-t-[28px] bg-[#dcffd0]/95 px-8 py-2 shadow-[0_-8px_22px_rgba(63,107,49,0.08)] backdrop-blur">
          <TabButton active={tab === "home"} icon="home" label="홈" onClick={() => setTab("home")} />
          <TabButton active={tab === "shop"} icon="shopping_bag" label="상점" onClick={() => setTab("shop")} />
          <TabButton active={tab === "storage"} icon="inventory_2" label="보관함" onClick={() => setTab("storage")} />
        </div>

        <div className="absolute right-5 top-8 z-30 rounded-full bg-white/90 px-3 py-2 text-[11px] font-extrabold text-[#3f6b31] shadow-md">
          Lv.{mascotLevel} · {mascotXP} XP
        </div>
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
      className={`flex flex-col items-center justify-center gap-1 rounded-full text-xs font-extrabold transition ${
        active ? "bg-[#aee894] text-[#3f6b31]" : "text-[#4f5f4b]"
      }`}
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      {label}
    </button>
  );
}

function Panel({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-x-4 bottom-24 z-50 max-h-[48%] overflow-y-auto rounded-3xl border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur">
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

function ShopButton({
  icon,
  name,
  meta,
  disabled,
  active,
  onClick,
}: {
  icon: string;
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
      className={`flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
        active
          ? "border-[#3f6b31] bg-[#e8ffd9]"
          : disabled
          ? "border-[#d8e7d1] bg-[#f4fbf0] opacity-75"
          : "border-[#d8e7d1] bg-white"
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf8e5] text-3xl">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-extrabold text-on-surface">{name}</span>
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
