'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  Task, Settings, Notification, TimetableDrawings, DayNotes,
  MASCOT_URLS, THEME_COLORS, TabType,
} from './types';
import {
  getKSTDate, getKSTDateString, getKSTParts, parseLocalDate,
  parseDurationMinutes,
} from './utils';

// ─── Default Settings ──────────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  username: '초보 탐험가',
  goalHours: '4시간 30분',
  avatarUrl: MASCOT_URLS['woolini'],
  activeMascot: 'woolini',
  themeColor: 'mint',
  bgMode: 'light',
  cardRoundness: 'standard',
  soundEnabled: true,
  customMascotUrl: '',
  deadlineAlertsEnabled: true,
};

// ─── Context Types ─────────────────────────────────────────────────────

interface StoreState {
  // Auth
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;

  // App tab
  activeTab: TabType;
  setActiveTab: (t: TabType) => void;

  // Tasks
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;

  // Timetable drawings
  timetableDrawings: TimetableDrawings;
  setTimetableDrawings: React.Dispatch<React.SetStateAction<TimetableDrawings>>;

  // Calendar
  calendarNotes: Record<string, string>;
  setCalendarNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  calendarMoods: Record<string, string>;
  setCalendarMoods: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  // Study notes
  studyNotes: Record<string, DayNotes>;
  setStudyNotes: React.Dispatch<React.SetStateAction<Record<string, DayNotes>>>;

  // Notifications
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;

  // Settings
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;

  // Mascot
  mascotXP: number;
  setMascotXP: React.Dispatch<React.SetStateAction<number>>;
  mascotLevel: number;
  setMascotLevel: React.Dispatch<React.SetStateAction<number>>;

  // Planner date navigation
  currentPlannerDate: string;
  setCurrentPlannerDate: (d: string) => void;

  // Timer
  activeTimerTaskId: number | null;
  setActiveTimerTaskId: React.Dispatch<React.SetStateAction<number | null>>;
  timerRunning: boolean;
  setTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;

  // Helpers
  todayStr: string;
  saveAllData: () => void;
  addXP: (amount: number) => void;
  getVisibleTasksForDate: (dateStr: string) => Task[];
  checkDeadlineAlerts: () => void;
  getMascotUrl: () => string;
  applyTheme: (color?: string) => void;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const todayStr = getKSTDateString(getKSTDate());

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('planner');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timetableDrawings, setTimetableDrawings] = useState<TimetableDrawings>({});
  const [calendarNotes, setCalendarNotes] = useState<Record<string, string>>({});
  const [calendarMoods, setCalendarMoods] = useState<Record<string, string>>({});
  const [studyNotes, setStudyNotes] = useState<Record<string, DayNotes>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [mascotXP, setMascotXP] = useState(450);
  const [mascotLevel, setMascotLevel] = useState(4);
  const [currentPlannerDate, setCurrentPlannerDate] = useState(todayStr);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Persistence ────────────────────────────────────────────────────

  const saveAllData = useCallback(() => {
    try {
      localStorage.setItem('woolini_tasks', JSON.stringify(tasks));
      localStorage.setItem('woolini_drawings', JSON.stringify(timetableDrawings));
      localStorage.setItem('woolini_calNotes', JSON.stringify(calendarNotes));
      localStorage.setItem('woolini_calMoods', JSON.stringify(calendarMoods));
      localStorage.setItem('woolini_studyNotes', JSON.stringify(studyNotes));
      localStorage.setItem('woolini_notifications', JSON.stringify(notifications));
      localStorage.setItem('woolini_settings', JSON.stringify(settings));
      localStorage.setItem('woolini_mascotXP', String(mascotXP));
      localStorage.setItem('woolini_mascotLevel', String(mascotLevel));
    } catch { /* ignore */ }
  }, [tasks, timetableDrawings, calendarNotes, calendarMoods, studyNotes, notifications, settings, mascotXP, mascotLevel]);

  useEffect(() => {
    // Load from localStorage
    try {
      const t = localStorage.getItem('woolini_tasks');
      if (t) setTasks(JSON.parse(t));
      const d = localStorage.getItem('woolini_drawings');
      if (d) setTimetableDrawings(JSON.parse(d));
      const cn = localStorage.getItem('woolini_calNotes');
      if (cn) setCalendarNotes(JSON.parse(cn));
      const cm = localStorage.getItem('woolini_calMoods');
      if (cm) setCalendarMoods(JSON.parse(cm));
      const sn = localStorage.getItem('woolini_studyNotes');
      if (sn) setStudyNotes(JSON.parse(sn));
      const n = localStorage.getItem('woolini_notifications');
      if (n) setNotifications(JSON.parse(n));
      const s = localStorage.getItem('woolini_settings');
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
      const xp = localStorage.getItem('woolini_mascotXP');
      if (xp) setMascotXP(parseInt(xp));
      const lv = localStorage.getItem('woolini_mascotLevel');
      if (lv) setMascotLevel(parseInt(lv));

      // Check login
      const loggedIn = localStorage.getItem('woolini_loggedIn');
      if (loggedIn === 'true') setIsLoggedIn(true);
    } catch { /* ignore */ }
  }, []);

  // Save on state changes
  useEffect(() => { if (isLoggedIn) saveAllData(); }, [tasks, timetableDrawings, calendarNotes, calendarMoods, studyNotes, notifications, settings, mascotXP, mascotLevel]); // eslint-disable-line

  // ─── Timer ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (timerRunning && activeTimerTaskId !== null) {
      timerIntervalRef.current = setInterval(() => {
        setTasks(prev => prev.map(t =>
          t.id === activeTimerTaskId ? { ...t, timeSeconds: t.timeSeconds + 1 } : t
        ));
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [timerRunning, activeTimerTaskId]);

  // ─── Theme ──────────────────────────────────────────────────────────

  const applyTheme = useCallback((colorKey?: string) => {
    const key = colorKey ?? settings.themeColor ?? 'mint';
    const color = THEME_COLORS[key] ?? THEME_COLORS['mint'];
    let styleEl = document.getElementById('dynamic-theme-style') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-theme-style';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      .bg-primary { background-color: ${color.primary} !important; }
      .text-primary { color: ${color.primary} !important; }
      .border-primary { border-color: ${color.primary} !important; }
      .bg-primary-container { background-color: ${color.primaryContainer} !important; }
      .ring-primary { --tw-ring-color: ${color.primary} !important; }
      .focus\\:border-primary:focus { border-color: ${color.primary} !important; }
    `;
    if (settings.bgMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeColor, settings.bgMode]);

  useEffect(() => { applyTheme(); }, [settings.themeColor, settings.bgMode]); // eslint-disable-line

  // ─── Helpers ────────────────────────────────────────────────────────

  const addXP = useCallback((amount: number) => {
    setMascotXP(prev => {
      const next = prev + amount;
      const xpPerLevel = 1000;
      if (next >= xpPerLevel) {
        setMascotLevel(lv => lv + 1);
        return next - xpPerLevel;
      }
      return next;
    });
  }, []);

  const getVisibleTasksForDate = useCallback((dateStr: string): Task[] => {
    const dueTodayTasks = tasks.filter(t => t.dueDate === dateStr);
    const regularTasks = tasks.filter(t => t.date === dateStr && t.dueDate !== dateStr);
    return [...dueTodayTasks, ...regularTasks];
  }, [tasks]);

  const checkDeadlineAlerts = useCallback(() => {
    if (!settings.deadlineAlertsEnabled) return;
    const kst = getKSTParts();
    const todayD = getKSTDateString();
    const newNotifs: Notification[] = [...notifications];
    tasks.forEach(task => {
      if (!task.dueDate || task.completed === 'o') return;
      const due = parseLocalDate(task.dueDate);
      const today = new Date(kst.year, kst.month, kst.day);
      const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
      const checkDiffs = [0, 3, 7];
      checkDiffs.forEach(d => {
        if (diff === d) {
          const key = `alert_${task.id}_D${d}`;
          if (!newNotifs.some(n => n.key === key)) {
            const label = d === 0 ? '오늘 마감' : `D-${d}`;
            newNotifs.push({
              key,
              text: `📌 ${label}: ${task.title}`,
              time: todayD,
            });
          }
        }
      });
    });
    if (newNotifs.length !== notifications.length) {
      setNotifications(newNotifs);
    }
  }, [tasks, notifications, settings.deadlineAlertsEnabled]);

  const getMascotUrl = useCallback(() => {
    if (settings.activeMascot === 'custom' && settings.customMascotUrl) {
      return settings.customMascotUrl;
    }
    return MASCOT_URLS[settings.activeMascot] ?? MASCOT_URLS['woolini'];
  }, [settings.activeMascot, settings.customMascotUrl]);

  // ─── Auto-Postpone Incomplete Tasks ────────────────────────────────

  useEffect(() => {
    if (!isLoggedIn || tasks.length === 0) return;
    const todayKSTStr = getKSTDateString();
    let modified = false;
    let loops = 0;
    const newTasks = [...tasks];

    while (loops < 30) {
      let postponedAny = false;
      for (let i = 0; i < newTasks.length; i++) {
        const task = newTasks[i];
        if (task.date < todayKSTStr && task.completed === '') {
          const currDate = parseLocalDate(task.date);
          currDate.setDate(currDate.getDate() + 1);
          const pad = (n: number) => String(n).padStart(2, '0');
          const nextDateStr = `${currDate.getFullYear()}-${pad(currDate.getMonth() + 1)}-${pad(currDate.getDate())}`;
          const alreadyCopied = newTasks.some(t => t.title === task.title && t.date === nextDateStr);
          if (!alreadyCopied) {
            newTasks.push({
              ...task,
              id: Date.now() + Math.floor(Math.random() * 100000),
              date: nextDateStr,
              completed: '',
              timeSeconds: 0,
            });
          }
          newTasks[i] = { ...task, completed: 'triangle' };
          postponedAny = true;
          modified = true;
        }
      }
      if (!postponedAny) break;
      loops++;
    }
    if (modified) setTasks(newTasks);
  }, [isLoggedIn]); // eslint-disable-line

  const handleLogin = (user: boolean) => {
    setIsLoggedIn(user);
    localStorage.setItem('woolini_loggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('woolini_loggedIn', 'false');
  };

  return (
    <StoreContext.Provider value={{
      isLoggedIn, setIsLoggedIn: handleLogin,
      activeTab, setActiveTab,
      tasks, setTasks,
      timetableDrawings, setTimetableDrawings,
      calendarNotes, setCalendarNotes,
      calendarMoods, setCalendarMoods,
      studyNotes, setStudyNotes,
      notifications, setNotifications,
      settings, setSettings,
      mascotXP, setMascotXP,
      mascotLevel, setMascotLevel,
      currentPlannerDate, setCurrentPlannerDate,
      activeTimerTaskId, setActiveTimerTaskId,
      timerRunning, setTimerRunning,
      todayStr,
      saveAllData,
      addXP,
      getVisibleTasksForDate,
      checkDeadlineAlerts,
      getMascotUrl,
      applyTheme,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
