// 기존 단일 HTML(code.html)의 로컬 스토리지 데이터 관리 로직을 Next.js 환경에 맞게 React Context API 및 전역 상태(학습 계획, 타이머, 캐릭터, 테마 등)로 리팩토링한 Context 파일입니다.
"use client";


import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface Task {
  id: number | string;
  title: string;
  description: string;
  timeSeconds: number;
  color: string;
  completed: "o" | "x" | "triangle" | "none";
  startTime: string | null;
  duration: string; // e.g. "2시간 30분"
  date: string; // YYYY-MM-DD
  dueDate?: string | null;
  difficulty?: string;
  expReward?: number;
}

export interface Concept {
  id: number;
  subject: string;
  date: string;
  content: string;
}

export interface WrongAnswer {
  id: number;
  subject: string;
  title: string;
  desc: string;
  imageUrl: string;
  resolved: boolean;
}

export interface RoomFurniture {
  id: string;
  itemId: string;
  x: number;
  y: number;
}

export interface AppSettings {
  username: string;
  goalHours: string;
  avatarUrl: string;
  activeMascot: "woolini" | "yang-i" | "gom-i" | "custom";
  themeColor: "mint" | "lavender" | "yellow" | "blue" | "pink" | "green";
  bgMode: "light" | "dark";
  cardRoundness: "standard" | "sharp";
  soundEnabled: boolean;
  customMascotUrl: string;
  deadlineAlertsEnabled: boolean;
  geminiApiKey: string;
  colorEasy: string;
  colorMedium: string;
  colorHard: string;
}

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  calendarNotes: Record<string, string>;
  setCalendarNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  calendarMoods: Record<string, string>;
  setCalendarMoods: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  timetableDrawings: Record<string, string>; // Format: 'YYYY-MM-DD_hour_part' -> color
  setTimetableDrawings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  concepts: Record<string, Concept[]>; // 'YYYY-MM-DD' -> Concept[]
  setConcepts: React.Dispatch<React.SetStateAction<Record<string, Concept[]>>>;
  wrongAnswers: Record<string, WrongAnswer[]>; // 'YYYY-MM-DD' -> WrongAnswer[]
  setWrongAnswers: React.Dispatch<React.SetStateAction<Record<string, WrongAnswer[]>>>;
  notifications: Array<{ id: number; text: string; date: string; read: boolean }>;
  setNotifications: React.Dispatch<React.SetStateAction<Array<{ id: number; text: string; date: string; read: boolean }>>>;
  mascotLevel: number;
  setMascotLevel: React.Dispatch<React.SetStateAction<number>>;
  mascotXP: number;
  setMascotXP: React.Dispatch<React.SetStateAction<number>>;
  addXP: (amount: number) => void;
  spendXP: (amount: number) => boolean;
  ownedFurniture: string[];
  setOwnedFurniture: React.Dispatch<React.SetStateAction<string[]>>;
  roomFurniture: RoomFurniture[];
  setRoomFurniture: React.Dispatch<React.SetStateAction<RoomFurniture[]>>;
  isLoggedIn: boolean;
  setIsLoggedIn: (loginState: boolean) => void;
  currentActiveTab: string;
  setCurrentActiveTab: (tab: string) => void;
  currentPlannerDate: string;
  setCurrentPlannerDate: (date: string) => void;
  createTask: (title: string, description: string, startTime: string | null, duration: string, dueDate: string | null, color: string, date?: string) => Promise<void>;
  updateTask: (id: string | number, updates: { title: string; description: string; startTime: string | null; duration: string; dueDate: string | null; color: string; }) => Promise<void>;
  deleteTask: (id: string | number) => Promise<void>;
  toggleTaskStatus: (id: string | number, status: "o" | "triangle" | "x") => Promise<void>;
  updateTaskTime: (id: string | number, studyTimeMinutes: number) => Promise<void>;
  saveCalendarDay: (dateKey: string, note: string, mood: string) => Promise<void>;
  deleteCalendarDay: (dateKey: string) => Promise<void>;
  updateCharacter: (mascotKey: "woolini" | "yang-i" | "gom-i" | "custom", name: string, imageUrl: string) => Promise<void>;
  updateUserProfile: (name: string, goalTimeMinutes: number, avatarUrl?: string, geminiApiKey?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentActiveTab, setCurrentActiveTab] = useState("planner");
  const [currentPlannerDate, setCurrentPlannerDate] = useState("");

  const [settings, setSettings] = useState<AppSettings>({
    username: "초보 탐험가",
    goalHours: "4시간 30분",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAL7pl4zo3S5ns-o-IQp1FW_FNeH4JNl2e17Y55WQLVloGJWyPd9QAaITZh2aNHwLGSRJpYy16uKevBs3ccUc5ETPxrfb6pJRBKDOVdkCMxiWAGIw-E3Q_XXrJLvxGrWezytHz_Rmj9b5X2W3oSH7xeGEHGjhym1K5ZETUK8Fo4iWuIv0I-49l5_TYd8eaVQdaWkirZYUv7cKL9mYiqSqG530T6nJwVlZ6hHncdvTO_FEHUkxUEfJUhol9P7Vp11o3PPhzgGDp2Rj8",
    activeMascot: "woolini",
    themeColor: "mint",
    bgMode: "light",
    cardRoundness: "standard",
    soundEnabled: true,
    customMascotUrl: "",
    deadlineAlertsEnabled: true,
    geminiApiKey: "",
    colorEasy: "#FFFACD",
    colorMedium: "#87CEFA",
    colorHard: "#FA8072",
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<Record<string, string>>({});
  const [calendarMoods, setCalendarMoods] = useState<Record<string, string>>({});
  const [calendarEventIds, setCalendarEventIds] = useState<Record<string, string>>({});
  const [timetableDrawings, setTimetableDrawings] = useState<Record<string, string>>({});
  const [concepts, setConcepts] = useState<Record<string, Concept[]>>({});
  const [wrongAnswers, setWrongAnswers] = useState<Record<string, WrongAnswer[]>>({});
  const [notifications, setNotifications] = useState<Array<{ id: number; text: string; date: string; read: boolean }>>([]);
  const [mascotLevel, setMascotLevel] = useState(1);
  const [mascotXP, setMascotXP] = useState(0);
  const [ownedFurniture, setOwnedFurniture] = useState<string[]>([]);
  const [roomFurniture, setRoomFurniture] = useState<RoomFurniture[]>([]);

  // Initialize dates
  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setCurrentPlannerDate(dateStr);
  }, []);

  // Fetch DB state when logged in via NextAuth
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    setIsLoggedIn(true);

    const fetchAllData = async () => {
      try {
        // 1. Fetch user profile
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const goalMin = profile.goalTime || 120;
          const goalHoursStr = `${Math.floor(goalMin / 60)}시간 ${goalMin % 60}분`;
          
          let userApiKey = "";
          try {
            const keyRes = await fetch("/api/user/gemini-key");
            if (keyRes.ok) {
              const keyData = await keyRes.json();
              userApiKey = keyData.geminiApiKey || "";
            }
          } catch (keyErr) {
            console.error("Failed to load Gemini API key:", keyErr);
          }

          setSettings((prev) => ({
            ...prev,
            username: profile.name || prev.username,
            avatarUrl: profile.image || prev.avatarUrl,
            goalHours: goalHoursStr,
            geminiApiKey: userApiKey,
          }));
        }

        // 2. Fetch active character
        const charRes = await fetch("/api/character");
        if (charRes.ok) {
          const char = await charRes.json();
          setMascotLevel(char.level || 1);
          setMascotXP(char.exp || 0);
          
          let activeMascot: "woolini" | "yang-i" | "gom-i" | "custom" = "woolini";
          if (char.name === "양양이") activeMascot = "yang-i";
          else if (char.name === "곰곰이") activeMascot = "gom-i";
          else if (char.imageUrl) activeMascot = "custom";

          setSettings((prev) => ({
            ...prev,
            activeMascot,
            customMascotUrl: char.imageUrl || "",
          }));
        }

        // 3. Fetch tasks
        const tasksRes = await fetch("/api/tasks");
        if (tasksRes.ok) {
          const dbTasks = await tasksRes.json();
          const mappedTasks: Task[] = dbTasks.map((t: any) => {
            const scheduled = t.scheduledAt ? new Date(t.scheduledAt) : null;
            let startTimeStr = null;
            let dateStr = currentPlannerDate;
            if (scheduled) {
              const pad = (n: number) => String(n).padStart(2, "0");
              dateStr = `${scheduled.getFullYear()}-${pad(scheduled.getMonth() + 1)}-${pad(scheduled.getDate())}`;
              startTimeStr = `${pad(scheduled.getHours())}:${pad(scheduled.getMinutes())}`;
            }

            const statusMap: Record<string, "o" | "triangle" | "x" | "none"> = {
              DONE: "o",
              PARTIAL: "triangle",
              FAILED: "x",
              TODO: "none",
            };

            return {
              id: t.id,
              title: t.title,
              description: t.description || "",
              timeSeconds: t.timeSeconds !== undefined ? t.timeSeconds : (t.studyTime || 0) * 60,
              color: t.color || "#a5d8d1",
              completed: t.completed || statusMap[t.status] || "none",
              startTime: startTimeStr,
              duration: t.duration || "0시간 0분",
              date: t.date || dateStr,
              dueDate: t.dueDate ? t.dueDate.split("T")[0] : null,
              difficulty: t.difficulty,
              expReward: t.expReward,
            };
          });
          setTasks(mappedTasks);
        }

        // 4. Fetch calendar events
        const eventsRes = await fetch("/api/events");
        if (eventsRes.ok) {
          const dbEvents = await eventsRes.json();
          const notesMap: Record<string, string> = {};
          const moodsMap: Record<string, string> = {};
          const idsMap: Record<string, string> = {};

          dbEvents.forEach((ev: any) => {
            const dateKey = ev.date.split("T")[0];
            notesMap[dateKey] = ev.title || "";
            moodsMap[dateKey] = ev.color || "";
            idsMap[dateKey] = ev.id;
          });

          setCalendarNotes(notesMap);
          setCalendarMoods(moodsMap);
          setCalendarEventIds(idsMap);
        }
      } catch (e) {
        console.error("Failed to load DB data in AppContext:", e);
      }
    };

    fetchAllData();
  }, [status, session]);

  // Load local settings (colors, theme, etc.) from localStorage on mount — always, regardless of auth
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedSettings = localStorage.getItem("sp_settings");
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Always apply locally stored UI/color preferences
        setSettings((prev) => ({
          ...prev,
          themeColor: parsed.themeColor || prev.themeColor,
          bgMode: parsed.bgMode || prev.bgMode,
          cardRoundness: parsed.cardRoundness || prev.cardRoundness,
          soundEnabled: parsed.soundEnabled !== undefined ? parsed.soundEnabled : prev.soundEnabled,
          deadlineAlertsEnabled: parsed.deadlineAlertsEnabled !== undefined ? parsed.deadlineAlertsEnabled : prev.deadlineAlertsEnabled,
          colorEasy: parsed.colorEasy || prev.colorEasy,
          colorMedium: parsed.colorMedium || prev.colorMedium,
          colorHard: parsed.colorHard || prev.colorHard,
        }));
      }
    } catch (e) {
      console.error("Failed to load local settings", e);
    }
  }, []);

  // Load from localStorage on mount (for non-authenticated mode fallback)
  useEffect(() => {
    if (typeof window === "undefined" || status === "authenticated") return;

    try {
      const storedSettings = localStorage.getItem("sp_settings");
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Exclude username and avatarUrl — these must always come from server when authenticated
        const { username: _u, avatarUrl: _a, ...localOnlySettings } = parsed;
        setSettings((prev) => ({ ...prev, ...localOnlySettings }));
      }

      const storedTasks = localStorage.getItem("sp_tasks");
      if (storedTasks) setTasks(JSON.parse(storedTasks));

      const storedCalNotes = localStorage.getItem("sp_calendarNotes");
      if (storedCalNotes) setCalendarNotes(JSON.parse(storedCalNotes));

      const storedCalMoods = localStorage.getItem("sp_calendarMoods");
      if (storedCalMoods) setCalendarMoods(JSON.parse(storedCalMoods));

      const storedDrawings = localStorage.getItem("sp_timetableDrawings");
      if (storedDrawings) setTimetableDrawings(JSON.parse(storedDrawings));

      const storedConcepts = localStorage.getItem("sp_concepts");
      if (storedConcepts) setConcepts(JSON.parse(storedConcepts));

      const storedWrongAnswers = localStorage.getItem("sp_wrongAnswers");
      if (storedWrongAnswers) setWrongAnswers(JSON.parse(storedWrongAnswers));

      const storedMascotLevel = localStorage.getItem("sp_mascotLevel");
      if (storedMascotLevel) setMascotLevel(parseInt(storedMascotLevel));

      const storedMascotXP = localStorage.getItem("sp_mascotXP");
      if (storedMascotXP) setMascotXP(parseInt(storedMascotXP));

      const storedNotifications = localStorage.getItem("sp_notifications");
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));

      const storedOwnedFurniture = localStorage.getItem("sp_ownedFurniture");
      if (storedOwnedFurniture) setOwnedFurniture(JSON.parse(storedOwnedFurniture));

      const storedRoomFurniture = localStorage.getItem("sp_roomFurniture");
      if (storedRoomFurniture) setRoomFurniture(JSON.parse(storedRoomFurniture));

      const loginState = localStorage.getItem("sp_logged_in");
      if (loginState === "true") setIsLoggedIn(true);
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }
  }, [status]);

  // Save settings to localStorage on changes — always (auth or not) so color/theme preferences persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sp_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentPlannerDate || status === "authenticated") return;
    localStorage.setItem("sp_tasks", JSON.stringify(tasks));
  }, [tasks, currentPlannerDate, status]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentPlannerDate || status === "authenticated") return;
    localStorage.setItem("sp_calendarNotes", JSON.stringify(calendarNotes));
  }, [calendarNotes, currentPlannerDate, status]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentPlannerDate || status === "authenticated") return;
    localStorage.setItem("sp_calendarMoods", JSON.stringify(calendarMoods));
  }, [calendarMoods, currentPlannerDate, status]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentPlannerDate) return;
    localStorage.setItem("sp_timetableDrawings", JSON.stringify(timetableDrawings));
  }, [timetableDrawings, currentPlannerDate]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentPlannerDate) return;
    localStorage.setItem("sp_concepts", JSON.stringify(concepts));
  }, [concepts, currentPlannerDate]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentPlannerDate) return;
    localStorage.setItem("sp_wrongAnswers", JSON.stringify(wrongAnswers));
  }, [wrongAnswers, currentPlannerDate]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentPlannerDate || status === "authenticated") return;
    localStorage.setItem("sp_mascotLevel", mascotLevel.toString());
  }, [mascotLevel, currentPlannerDate, status]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentPlannerDate || status === "authenticated") return;
    localStorage.setItem("sp_mascotXP", mascotXP.toString());
  }, [mascotXP, currentPlannerDate, status]);

  useEffect(() => {
    if (typeof window === "undefined" || !currentPlannerDate) return;
    localStorage.setItem("sp_notifications", JSON.stringify(notifications));
  }, [notifications, currentPlannerDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sp_ownedFurniture", JSON.stringify(ownedFurniture));
  }, [ownedFurniture]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sp_roomFurniture", JSON.stringify(roomFurniture));
  }, [roomFurniture]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sp_logged_in", isLoggedIn ? "true" : "false");
  }, [isLoggedIn]);

  // Sync theme to root html element class
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Remove previous background classes
    root.classList.remove("light", "dark");
    root.classList.add(settings.bgMode);

    // Toggle card corner roundness style
    if (settings.cardRoundness === "sharp") {
      root.classList.add("theme-sharp");
    } else {
      root.classList.remove("theme-sharp");
    }

    // Apply color theme mappings
    const themeColors: Record<string, string> = {
      mint: "#356761",
      lavender: "#655978",
      yellow: "#665f34",
      blue: "#3b82f6",
      pink: "#ec4899",
      green: "#10b981",
    };
    const primaryColor = themeColors[settings.themeColor] || themeColors.mint;
    root.style.setProperty("--primary-color", primaryColor);
  }, [settings.bgMode, settings.themeColor, settings.cardRoundness]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const addXP = (amount: number) => {
    setMascotXP((prevXP) => {
      let newXP = prevXP + amount;
      let newLevel = mascotLevel;
      while (newXP >= 1000) {
        newXP -= 1000;
        newLevel += 1;
        if (typeof window !== "undefined" && settings.soundEnabled) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, index) => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = "triangle";
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.1);
              gain.gain.setValueAtTime(0.15, audioCtx.currentTime + index * 0.1);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + index * 0.1 + 0.4);
              osc.start(audioCtx.currentTime + index * 0.1);
              osc.stop(audioCtx.currentTime + index * 0.1 + 0.5);
            });
          } catch (e) {
            console.error(e);
          }
        }
      }
      if (newLevel !== mascotLevel) {
        setMascotLevel(newLevel);
        setNotifications((prev) => [
          {
            id: Date.now(),
            text: `🎉 축하합니다! 마스코트 레벨이 Level ${newLevel}로 상승했습니다!`,
            date: currentPlannerDate,
            read: false,
          },
          ...prev,
        ]);
        if (isLoggedIn) {
          fetch("/api/character", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level: newLevel, exp: newXP }),
          }).catch(console.error);
        }
      } else {
        if (isLoggedIn) {
          fetch("/api/character", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exp: newXP }),
          }).catch(console.error);
        }
      }
      return newXP;
    });
  };

  const spendXP = (amount: number) => {
    if (mascotXP < amount) return false;
    const nextXP = mascotXP - amount;
    setMascotXP(nextXP);

    if (isLoggedIn) {
      fetch("/api/character", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exp: nextXP }),
      }).catch(console.error);
    }

    return true;
  };

  // Real Database Syncing Helper Methods
  const createTask = async (
    title: string,
    description: string,
    startTime: string | null,
    duration: string,
    dueDate: string | null,
    color: string,
    date?: string
  ) => {
    const targetDate = date || currentPlannerDate;
    const tempId = Date.now();
    const newTask: Task = {
      id: tempId,
      title,
      description,
      timeSeconds: 0,
      color,
      completed: "none",
      startTime,
      duration,
      date: targetDate,
      dueDate,
    };

    setTasks((prev) => [...prev, newTask]);
    addXP(15);

    if (isLoggedIn) {
      try {
        let scheduledAt = null;
        if (startTime) {
          scheduledAt = new Date(`${targetDate}T${startTime}:00`);
        }
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            startTime,
            duration,
            dueDate,
            color,
            date: targetDate,
            scheduledAt,
          }),
        });
        const savedTask = await res.json();
        if (res.ok && savedTask.id) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === tempId
                ? {
                    ...t,
                    id: savedTask.id,
                    difficulty: savedTask.difficulty,
                    expReward: savedTask.expReward,
                  }
                : t
            )
          );
        }
      } catch (e) {
        console.error("Failed to save task to DB", e);
      }
    }
  };

  const updateTask = async (
    id: number | string,
    updates: {
      title: string;
      description: string;
      startTime: string | null;
      duration: string;
      dueDate: string | null;
      color: string;
    }
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    if (isLoggedIn && typeof id === "string") {
      try {
        let scheduledAt = null;
        if (updates.startTime) {
          scheduledAt = new Date(`${currentPlannerDate}T${updates.startTime}:00`);
        }
        await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updates.title,
            description: updates.description,
            startTime: updates.startTime,
            duration: updates.duration,
            dueDate: updates.dueDate,
            color: updates.color,
            scheduledAt,
          }),
        });
      } catch (e) {
        console.error("Failed to update task in DB", e);
      }
    }
  };

  const deleteTask = async (id: number | string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    if (isLoggedIn && typeof id === "string") {
      try {
        await fetch(`/api/tasks/${id}`, {
          method: "DELETE",
        });
      } catch (e) {
        console.error("Failed to delete task from DB", e);
      }
    }
  };

  const toggleTaskStatus = async (
    id: number | string,
    status: "o" | "triangle" | "x" | "none"
  ) => {
    let xpAwarded = 0;
    let finalNextStatus: "o" | "triangle" | "x" | "none" = "none";

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.completed === status ? "none" : status;
          finalNextStatus = nextStatus;
          if (nextStatus === "o") {
            xpAwarded = t.expReward || 30;
          }
          return { ...t, completed: nextStatus };
        }
        return t;
      })
    );

    if (xpAwarded > 0) {
      addXP(xpAwarded);
    }

    if (isLoggedIn && typeof id === "string") {
      try {
        const dbStatusMap = {
          o: "DONE",
          triangle: "PARTIAL",
          x: "FAILED",
          none: "TODO",
        };
        const dbStatus = dbStatusMap[finalNextStatus];
        await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: dbStatus }),
        });
      } catch (e) {
        console.error("Failed to toggle task status in DB", e);
      }
    }
  };

  const updateTaskTime = async (id: number | string, studyTimeMinutes: number) => {
    if (isLoggedIn && typeof id === "string") {
      try {
        await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studyTime: studyTimeMinutes }),
        });
      } catch (e) {
        console.error("Failed to update task time in DB", e);
      }
    }
  };

  const saveCalendarDay = async (dateKey: string, note: string, mood: string) => {
    setCalendarNotes((prev) => ({ ...prev, [dateKey]: note }));
    setCalendarMoods((prev) => ({ ...prev, [dateKey]: mood }));

    if (isLoggedIn) {
      try {
        const existingEventId = calendarEventIds[dateKey];
        if (existingEventId) {
          if (!note.trim() && !mood) {
            await deleteCalendarDay(dateKey);
            return;
          }
          await fetch(`/api/events/${existingEventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: note, color: mood }),
          });
        } else {
          if (!note.trim() && !mood) return;
          const res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: note, date: dateKey, color: mood }),
          });
          const savedEvent = await res.json();
          if (res.ok && savedEvent.id) {
            setCalendarEventIds((prev) => ({ ...prev, [dateKey]: savedEvent.id }));
          }
        }
      } catch (e) {
        console.error("Failed to save calendar event to DB", e);
      }
    }
  };

  const deleteCalendarDay = async (dateKey: string) => {
    setCalendarNotes((prev) => {
      const copy = { ...prev };
      delete copy[dateKey];
      return copy;
    });
    setCalendarMoods((prev) => {
      const copy = { ...prev };
      delete copy[dateKey];
      return copy;
    });

    if (isLoggedIn) {
      try {
        const existingEventId = calendarEventIds[dateKey];
        if (existingEventId) {
          await fetch(`/api/events/${existingEventId}`, {
            method: "DELETE",
          });
          setCalendarEventIds((prev) => {
            const copy = { ...prev };
            delete copy[dateKey];
            return copy;
          });
        }
      } catch (e) {
        console.error("Failed to delete calendar event from DB", e);
      }
    }
  };

  const updateCharacter = async (
    mascotKey: "woolini" | "yang-i" | "gom-i" | "custom",
    name: string,
    imageUrl: string
  ) => {
    updateSettings({
      activeMascot: mascotKey,
      customMascotUrl: mascotKey === "custom" ? imageUrl : "",
      avatarUrl: imageUrl,
    });

    if (isLoggedIn) {
      try {
        await fetch("/api/character", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, imageUrl }),
        });
      } catch (e) {
        console.error("Failed to update character details in DB", e);
      }
    }
  };

  const updateUserProfile = async (name: string, goalTimeMinutes: number, avatarUrl?: string, geminiApiKey?: string) => {
    const goalHoursStr = `${Math.floor(goalTimeMinutes / 60)}시간 ${goalTimeMinutes % 60}분`;
    updateSettings({
      username: name,
      goalHours: goalHoursStr,
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(geminiApiKey !== undefined && { geminiApiKey }),
    });

    if (isLoggedIn) {
      try {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            goalTime: goalTimeMinutes,
            ...(avatarUrl !== undefined && { image: avatarUrl }),
          }),
        });

        if (geminiApiKey !== undefined) {
          await fetch("/api/user/gemini-key", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ geminiApiKey }),
          });
        }
      } catch (e) {
        console.error("Failed to update user profile or Gemini key in DB", e);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        tasks,
        setTasks,
        calendarNotes,
        setCalendarNotes,
        calendarMoods,
        setCalendarMoods,
        timetableDrawings,
        setTimetableDrawings,
        concepts,
        setConcepts,
        wrongAnswers,
        setWrongAnswers,
        notifications,
        setNotifications,
        mascotLevel,
        setMascotLevel,
        mascotXP,
        setMascotXP,
        addXP,
        spendXP,
        ownedFurniture,
        setOwnedFurniture,
        roomFurniture,
        setRoomFurniture,
        isLoggedIn,
        setIsLoggedIn,
        currentActiveTab,
        setCurrentActiveTab,
        currentPlannerDate,
        setCurrentPlannerDate,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        updateTaskTime,
        saveCalendarDay,
        deleteCalendarDay,
        updateCharacter,
        updateUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
