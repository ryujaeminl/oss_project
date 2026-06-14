// 기존 단일 HTML(code.html)의 플래너 기능을 Next.js 프레임워크 기반으로 전환하여 구현한 플래너 메인 화면(투두 관리, 타임테이블 작성, 목표 달성률 확인)입니다.
"use client";


import React, { useState, useEffect, useRef } from "react";
import { useApp, Task } from "@/lib/AppContext";
import { useRouter } from "next/navigation";

const MASCOT_IMAGES = {
  woolini:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAL7pl4zo3S5ns-o-IQp1FW_FNeH4JNl2e17Y55WQLVloGJWyPd9QAaITZh2aNHwLGSRJpYy16uKevBs3ccUc5ETPxrfb6pJRBKDOVdkCMxiWAGIw-E3Q_XXrJLvxGrWezytHz_Rmj9b5X2W3oSH7xeGEHGjhym1K5ZETUK8Fo4iWuIv0I-49l5_TYd8eaVQdaWkirZYUv7cKL9mYiqSqG530T6nJwVlZ6hHncdvTO_FEHUkxUEfJUhol9P7Vp11o3PPhzgGDp2Rj8",
  "yang-i": "https://img.icons8.com/color/150/sheep.png",
  "gom-i": "https://img.icons8.com/color/150/teddy-bear.png",
};

export default function PlannerPage() {
  const router = useRouter();
  const {
    tasks,
    setTasks,
    settings,
    timetableDrawings,
    setTimetableDrawings,
    currentPlannerDate,
    setCurrentPlannerDate,
    setNotifications,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    updateTaskTime,
  } = useApp();

  // Ref to track and cancel scheduled postpone timeouts
  const postponeTimeoutsRef = useRef<Record<string | number, NodeJS.Timeout>>({});

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states for Add/Edit task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [startHour, setStartHour] = useState("");
  const [startMin, setStartMin] = useState("");
  const [durationHour, setDurationHour] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskColor, setTaskColor] = useState("#85b8b1");

  // Timer states
  const [activeTaskId, setActiveTaskId] = useState<number | string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Timetable display options
  const [isTextOn, setIsTextOn] = useState(true);
  const [isColorOn, setIsColorOn] = useState(true);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [floatingMatePosition, setFloatingMatePosition] = useState({ x: 88, y: 86 });

  const plannerRef = useRef<HTMLDivElement>(null);
  const floatingMateDragRef = useRef({ dragging: false, moved: false });

  // Setup interval for active stopwatch timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && activeTaskId !== null) {
      interval = setInterval(() => {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === activeTaskId ? { ...t, timeSeconds: t.timeSeconds + 1 } : t
          )
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, activeTaskId, setTasks]);

  // Check deadline alerts when planner date changes
  useEffect(() => {
    if (!currentPlannerDate) return;
    const nowStr = currentPlannerDate;
    
    // Check due dates and create notifications
    const newNotifications: any[] = [];
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const due = new Date(task.dueDate);
      const plan = new Date(nowStr);
      due.setHours(0, 0, 0, 0);
      plan.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - plan.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if ([7, 3, 1, 0].includes(diffDays)) {
        const alertKey = `alert_${task.id}_${diffDays}`;
        const dayWord =
          diffDays === 7
            ? "일주일"
            : diffDays === 0
            ? "오늘"
            : `${diffDays}일`;
        const notifText =
          diffDays === 0
            ? `[${task.title}] 마감일이 오늘까지입니다!`
            : `[${task.title}] 마감일이 ${dayWord} 남았습니다!`;

        newNotifications.push({
          id: Date.now() + Math.random(),
          key: alertKey,
          text: notifText,
          date: nowStr,
          read: false,
        });
      }
    });

    if (newNotifications.length > 0) {
      setNotifications((prev) => {
        // Filter out duplicates
        const filtered = newNotifications.filter(
          (n) => !prev.some((p: any) => p.key === n.key)
        );
        return [...filtered, ...prev];
      });
    }
  }, [currentPlannerDate, tasks, setNotifications]);

  // Stop drawing on mouseUp / touchend globally
  useEffect(() => {
    const handleRelease = () => {
      setIsDrawing(false);
    };
    window.addEventListener("mouseup", handleRelease);
    window.addEventListener("touchend", handleRelease);
    return () => {
      window.removeEventListener("mouseup", handleRelease);
      window.removeEventListener("touchend", handleRelease);
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sp_floatingMatePosition");
      if (stored) setFloatingMatePosition(JSON.parse(stored));
    } catch {
      // ignore stored layout failures
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sp_floatingMatePosition", JSON.stringify(floatingMatePosition));
    } catch {
      // ignore storage failures
    }
  }, [floatingMatePosition]);

  const getActiveMascotUrl = () => {
    const active = settings.activeMascot || "woolini";
    if (active === "custom") return settings.customMascotUrl || MASCOT_IMAGES.woolini;
    return MASCOT_IMAGES[active] || MASCOT_IMAGES.woolini;
  };

  const clampFloatingMate = (x: number, y: number) => ({
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(88, Math.max(12, y)),
  });

  const updateFloatingMateFromPoint = (clientX: number, clientY: number) => {
    const planner = plannerRef.current;
    if (!planner) return;
    const rect = planner.getBoundingClientRect();
    const nextX = ((clientX - rect.left) / rect.width) * 100;
    const nextY = ((clientY - rect.top) / rect.height) * 100;
    setFloatingMatePosition(clampFloatingMate(nextX, nextY));
  };

  const handleFloatingMatePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    floatingMateDragRef.current = { dragging: true, moved: false };
  };

  const handleFloatingMatePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!floatingMateDragRef.current.dragging) return;
    floatingMateDragRef.current.moved = true;
    updateFloatingMateFromPoint(e.clientX, e.clientY);
  };

  const handleFloatingMatePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const wasMoved = floatingMateDragRef.current.moved;
    floatingMateDragRef.current = { dragging: false, moved: false };
    if (!wasMoved) router.push("/character");
  };

  // Helper date parsing/formatting
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-");
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
  };

  const getKSTDateString = (dateObj: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(
      dateObj.getDate()
    )}`;
  };

  const changePlannerDate = (offset: number) => {
    const d = parseLocalDate(currentPlannerDate);
    d.setDate(d.getDate() + offset);
    setCurrentPlannerDate(getKSTDateString(d));
  };

  const getWeeklyDays = () => {
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const current = parseLocalDate(currentPlannerDate);
    const currentDayOfWeek = current.getDay();

    const sunDate = new Date(current);
    sunDate.setDate(current.getDate() - currentDayOfWeek);

    const pad = (n: number) => String(n).padStart(2, "0");
    const week = [];

    for (let i = 0; i < 7; i++) {
      const tempDate = new Date(sunDate);
      tempDate.setDate(sunDate.getDate() + i);

      const dateStr = `${tempDate.getFullYear()}-${pad(
        tempDate.getMonth() + 1
      )}-${pad(tempDate.getDate())}`;
      week.push({
        dateStr,
        dayNum: tempDate.getDate(),
        dayName: daysOfWeek[i],
        isSunday: i === 0,
        isSaturday: i === 6,
      });
    }
    return week;
  };

  const formatTimerString = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const parseDurationMinutes = (durationStr: string) => {
    if (!durationStr) return 0;
    let dh = 0,
      dm = 0;
    const hMatch = durationStr.match(/(\d+)\s*시간/);
    const mMatch = durationStr.match(/(\d+)\s*분/);
    if (hMatch) dh = parseInt(hMatch[1]);
    if (mMatch) dm = parseInt(mMatch[1]);
    return dh * 60 + dm;
  };

  // Target task lists
  const dueTodayTasks = tasks.filter(
    (t) => t.dueDate === currentPlannerDate && t.date === currentPlannerDate
  );
  const regularTasks = tasks.filter(
    (t) => t.date === currentPlannerDate && t.dueDate !== currentPlannerDate
  );
  const allVisibleTasks = [...dueTodayTasks, ...regularTasks];
  const completedCount = allVisibleTasks.filter((t) => t.completed === "o").length;
  const remainingCount = allVisibleTasks.length - completedCount;
  const totalSeconds = allVisibleTasks.reduce((sum, t) => sum + t.timeSeconds, 0);

  const handleWrapChange = (valStr: string, maxVal: number, setter: (v: string) => void) => {
    if (valStr === "") {
      setter("");
      return;
    }
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;

    if (val < 0) {
      setter(String(maxVal));
    } else if (val > maxVal) {
      setter("0");
    } else {
      setter(valStr);
    }
  };

  // Task Handlers
  const openAddTaskModal = () => {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDesc("");
    
    // Set default starting time to current time
    const now = new Date();
    setStartHour(now.getHours().toString().padStart(2, "0"));
    setStartMin(now.getMinutes().toString().padStart(2, "0"));
    
    setDurationHour("");
    setDurationMin("");
    setDueDate("");
    setTaskColor("#85b8b1");
    setIsAddModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    if (task.startTime) {
      const [h, m] = task.startTime.split(":");
      setStartHour(parseInt(h).toString());
      setStartMin(parseInt(m).toString());
    } else {
      setStartHour("");
      setStartMin("");
    }
    if (task.duration) {
      const hMatch = task.duration.match(/(\d+)\s*시간/);
      const mMatch = task.duration.match(/(\d+)\s*분/);
      setDurationHour(hMatch ? hMatch[1] : "");
      setDurationMin(mMatch ? mMatch[1] : "");
    } else {
      setDurationHour("");
      setDurationMin("");
    }
    setDueDate(task.dueDate || "");
    setTaskColor(task.color);
    setIsAddModalOpen(true);
  };

  const handleTaskSubmit = () => {
    if (!taskTitle.trim()) {
      alert("과목명을 입력해주세요.");
      return;
    }

    let startTime = null;
    if (startHour !== "") {
      const sh = parseInt(startHour);
      const sm = startMin !== "" ? parseInt(startMin) : 0;
      if (sh >= 0 && sh <= 23 && sm >= 0 && sm <= 59) {
        startTime = `${String(sh).padStart(2, "0")}:${String(sm).padStart(
          2,
          "0"
        )}`;
      }
    }

    let duration = "0시간 0분";
    if (durationHour !== "" || durationMin !== "") {
      const dh = parseInt(durationHour) || 0;
      const dm = parseInt(durationMin) || 0;
      duration = `${dh}시간 ${dm}분`;
    }

    if (editingTask) {
      // Edit
      updateTask(editingTask.id, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        startTime,
        duration,
        dueDate: dueDate || null,
        color: taskColor,
      });
    } else {
      // Create new
      createTask(
        taskTitle.trim(),
        taskDesc.trim(),
        startTime,
        duration,
        dueDate || null,
        taskColor
      );
    }

    setIsAddModalOpen(false);
  };

  const handleTaskDelete = (id: number | string) => {
    const task = tasks.find((t) => t.id === id);
    if (activeTaskId === id) {
      setIsTimerRunning(false);
      setActiveTaskId(null);
    }
    deleteTask(id);

    // Cancel any scheduled tomorrow-copy timeout for this task
    if (postponeTimeoutsRef.current[id]) {
      clearTimeout(postponeTimeoutsRef.current[id]);
      delete postponeTimeoutsRef.current[id];
    }

    if (task) {
      const currDate = parseLocalDate(task.date);
      currDate.setDate(currDate.getDate() + 1);
      const pad = (n: number) => String(n).padStart(2, "0");
      const nextDateStr = `${currDate.getFullYear()}-${pad(
        currDate.getMonth() + 1
      )}-${pad(currDate.getDate())}`;

      const nextDayTask = tasks.find(
        (t) => t.title === task.title && t.date === nextDateStr
      );
      if (nextDayTask) {
        deleteTask(nextDayTask.id);
      }
    }
  };

  const setTaskCheck = (id: number | string, status: "o" | "triangle" | "x") => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const nextStatus = task.completed === status ? "none" : status;
    toggleTaskStatus(id, status);

    // Cancel any scheduled tomorrow-copy timeout for this task
    if (postponeTimeoutsRef.current[id]) {
      clearTimeout(postponeTimeoutsRef.current[id]);
      delete postponeTimeoutsRef.current[id];
    }
    
    if (nextStatus === "triangle" || nextStatus === "x") {
      postponeTimeoutsRef.current[id] = setTimeout(() => {
        postponeTaskToNextDay(task);
        delete postponeTimeoutsRef.current[id];
      }, 600);
    } else {
      removePostponedTaskFromNextDay(task);
    }
  };

  const removePostponedTaskFromNextDay = (task: Task) => {
    const currDate = parseLocalDate(task.date);
    currDate.setDate(currDate.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const nextDateStr = `${currDate.getFullYear()}-${pad(
      currDate.getMonth() + 1
    )}-${pad(currDate.getDate())}`;

    const nextDayTask = tasks.find(
      (t) => t.title === task.title && t.date === nextDateStr
    );
    if (nextDayTask) {
      deleteTask(nextDayTask.id);
    }
  };

  const postponeTaskToNextDay = (task: Task) => {
    const currDate = parseLocalDate(task.date);
    currDate.setDate(currDate.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const nextDateStr = `${currDate.getFullYear()}-${pad(
      currDate.getMonth() + 1
    )}-${pad(currDate.getDate())}`;

    const alreadyCopied = tasks.some(
      (t) => t.title === task.title && t.date === nextDateStr
    );
    if (!alreadyCopied) {
      createTask(
        task.title,
        task.description,
        task.startTime,
        task.duration,
        task.dueDate || null,
        task.color,
        nextDateStr
      );
    }
    alert("공부 계획이 다음날로 복사되었습니다! ➡️");
  };

  const toggleStopwatch = (id: number | string) => {
    if (activeTaskId === id) {
      const nextRunning = !isTimerRunning;
      setIsTimerRunning(nextRunning);
      if (!nextRunning) {
        const task = tasks.find(t => t.id === id);
        if (task) {
          updateTaskTime(id, Math.floor(task.timeSeconds / 60));
        }
      }
    } else {
      if (activeTaskId !== null) {
        const prevTask = tasks.find(t => t.id === activeTaskId);
        if (prevTask) {
          updateTaskTime(activeTaskId, Math.floor(prevTask.timeSeconds / 60));
        }
      }
      setActiveTaskId(id);
      setIsTimerRunning(true);
    }
  };

  const resetTaskStopwatch = (id: number | string) => {
    if (activeTaskId === id) {
      setIsTimerRunning(false);
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, timeSeconds: 0 } : t))
    );
    updateTaskTime(id, 0);
  };

  // Timetable grid functions
  const getTaskColorForCell = (hour: number, part: number) => {
    const dayTasks = tasks.filter((t) => t.date === currentPlannerDate);
    const cellMinutes = hour * 60 + part * 10;

    const getDifficultyColor = (difficulty?: string, fallbackColor?: string) => {
      if (difficulty === "easy") return settings.colorEasy || "#FFFACD";
      if (difficulty === "medium") return settings.colorMedium || "#87CEFA";
      if (difficulty === "hard") return settings.colorHard || "#FA8072";
      return fallbackColor || "#85b8b1";
    };

    for (const task of dayTasks) {
      if (!task.startTime) continue;
      const [sh, sm] = task.startTime.split(":").map(Number);
      const startTotalMinutes = sh * 60 + sm;
      const durationMinutes = parseDurationMinutes(task.duration);
      const endTotalMinutes = startTotalMinutes + durationMinutes;

      if (cellMinutes >= startTotalMinutes && cellMinutes < endTotalMinutes) {
        return getDifficultyColor(task.difficulty, task.color);
      }

      // Midnight wrap-around check (1440 minutes)
      if (endTotalMinutes > 1440) {
        const wrappedEnd = endTotalMinutes - 1440;
        if (cellMinutes < wrappedEnd) {
          return getDifficultyColor(task.difficulty, task.color);
        }
      }
    }
    return null;
  };

  const handleCellMouseDown = (e: React.MouseEvent, hour: number, part: number) => {
    e.preventDefault();
    const key = `${currentPlannerDate}_${hour}_${part}`;
    const erasing = !!timetableDrawings[key];
    setIsErasing(erasing);
    setIsDrawing(true);
    colorCell(hour, part, erasing);
  };

  const handleCellMouseEnter = (hour: number, part: number) => {
    if (isDrawing) {
      colorCell(hour, part, isErasing);
    }
  };

  const handleCellTouchStart = (e: React.TouchEvent, hour: number, part: number) => {
    if (e.cancelable) e.preventDefault();
    const key = `${currentPlannerDate}_${hour}_${part}`;
    const erasing = !!timetableDrawings[key];
    setIsErasing(erasing);
    setIsDrawing(true);
    colorCell(hour, part, erasing);
  };

  const handleCellTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    
    const hourAttr = element.getAttribute("data-hour");
    const partAttr = element.getAttribute("data-part");
    
    if (hourAttr !== null && partAttr !== null) {
      const h = parseInt(hourAttr, 10);
      const p = parseInt(partAttr, 10);
      colorCell(h, p, isErasing);
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const colorCell = (hour: number, part: number, erase: boolean) => {
    const key = `${currentPlannerDate}_${hour}_${part}`;
    setTimetableDrawings((prev) => {
      const copy = { ...prev };
      if (erase) {
        delete copy[key];
      } else {
        copy[key] = taskColor;
      }
      return copy;
    });
  };

  return (
    <div ref={plannerRef} className="flex-1 flex flex-col p-3.5 space-y-3 relative overflow-hidden">
      
      {/* Top Banner D-Day Alert */}
      {settings.deadlineAlertsEnabled && dueTodayTasks.length > 0 && (
        <div className="space-y-1.5 shrink-0">
          {dueTodayTasks.map((task) => (
            <div
              key={task.id}
              className="p-2 rounded-xl bg-error/10 border border-error/25 flex items-center gap-1.5 text-[9px] text-error dark:text-error-container bubbly-shadow animate-pulse"
            >
              <span className="material-symbols-outlined text-xs text-error font-bold">
                alarm
              </span>
              <span className="font-bold leading-none truncate">
                오늘 마감: [{task.title}] 마감일이 오늘까지입니다! ⚠️
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Date Selector & Total display */}
      <div className="flex items-center justify-between bg-primary/10 p-2.5 rounded-2xl border border-primary/20 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => changePlannerDate(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary/20 transition-all text-primary active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <span className="font-headline font-bold text-xs text-primary tracking-wide">
            {currentPlannerDate.replace(/-/g, ".")}
          </span>
          <button
            onClick={() => changePlannerDate(1)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary/20 transition-all text-primary active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-bold text-on-surface-variant block uppercase tracking-wider">
            총 공부 시간
          </span>
          <span className="font-headline font-bold text-sm text-primary tabular-nums tracking-tighter">
            {formatTimerString(totalSeconds)}
          </span>
        </div>
      </div>

      {/* Completion status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-container-low dark:bg-neutral-800 rounded-xl border border-surface-variant/20 text-[10px] font-bold shrink-0">
        <span className="text-on-surface-variant">오늘의 학습 현황</span>
        <div className="flex gap-2.5 items-center">
          <span className="text-primary flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[11px]">check_circle</span>
            완료 <span>{completedCount}</span>개
          </span>
          <span className="text-on-surface-variant/40">|</span>
          <span className="text-error flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[11px]">pending</span>
            남음 <span>{remainingCount}</span>개
          </span>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-surface-container-low dark:bg-neutral-800 rounded-2xl p-1.5 border border-surface-variant/20 shadow-sm grid grid-cols-7 gap-1 select-none shrink-0">
        {getWeeklyDays().map((day) => {
          const isSelected = day.dateStr === currentPlannerDate;
          let btnClasses =
            "flex flex-col items-center justify-center p-1.5 rounded-xl transition-all active:scale-95 cursor-pointer ";
          if (isSelected) {
            btnClasses += "bg-primary text-white shadow-sm scale-105 font-bold";
          } else {
            btnClasses += "hover:bg-primary/10 text-on-surface-variant/90";
          }
          let colorClass = "";
          if (!isSelected) {
            if (day.isSunday) colorClass = " text-error";
            else if (day.isSaturday) colorClass = " text-secondary";
          }
          return (
            <button
              key={day.dateStr}
              onClick={() => setCurrentPlannerDate(day.dateStr)}
              className={btnClasses}
            >
              <span
                className={`text-[7px] uppercase tracking-wider block font-bold opacity-80${colorClass}`}
              >
                {day.dayName}
              </span>
              <span className="text-xs font-headline font-bold block mt-0.5">
                {day.dayNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split Layout: Cards vs Timetable */}
      <div className="flex-1 grid grid-cols-12 gap-2.5 min-h-0 relative">
        {/* Left: Task Cards List */}
        <div className="col-span-5 flex flex-col gap-2.5 min-h-0 overflow-y-auto no-scrollbar pb-16">
          <div className="flex flex-col gap-2.5">
            {allVisibleTasks.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/60 italic text-center py-4">
                오늘 등록된 계획이 없습니다.
              </p>
            ) : (
              allVisibleTasks.map((t) => {
                const isO = t.completed === "o";
                const isTri = t.completed === "triangle";
                const isX = t.completed === "x";

                const oClass = isO
                  ? "bg-primary/20 border-2 border-primary text-primary font-bold animate-pulse"
                  : "border border-outline-variant/60 text-on-surface-variant/70";
                const triClass = isTri
                  ? "bg-primary/20 border-2 border-primary text-primary font-bold animate-pulse"
                  : "border border-outline-variant/60 text-on-surface-variant/70";
                const xClass = isX
                  ? "bg-primary/20 border-2 border-primary text-primary font-bold animate-pulse"
                  : "border border-outline-variant/60 text-on-surface-variant/70";

                const isTicking = activeTaskId === t.id && isTimerRunning;

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-surface-container-low dark:bg-surface-container border border-surface-variant/30 flex flex-col gap-2.5 transition-all bubbly-shadow relative"
                    style={{
                      borderLeft: `5px solid ${
                        t.dueDate === currentPlannerDate
                          ? "#ef4444"
                          : t.difficulty === "easy"
                          ? settings.colorEasy || "#FFFACD"
                          : t.difficulty === "medium"
                          ? settings.colorMedium || "#87CEFA"
                          : t.difficulty === "hard"
                          ? settings.colorHard || "#FA8072"
                          : t.color || "#85b8b1"
                      }`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        <input
                          type="checkbox"
                          checked={isO}
                          onChange={(e) => setTaskCheck(t.id, e.target.checked ? "o" : "x")}
                          className="w-3.5 h-3.5 text-primary bg-surface-container border-outline-variant/60 rounded focus:ring-primary focus:ring-1 shrink-0 cursor-pointer"
                        />
                        <div className="overflow-hidden flex-1 min-w-0">
                          <h4
                            className={`text-xs font-bold text-on-surface truncate flex items-center ${
                              isO ? "line-through opacity-50" : ""
                            }`}
                          >
                            {t.dueDate === currentPlannerDate && (
                              <span className="inline-block text-[7px] bg-error/15 text-error px-1 py-0.5 rounded font-bold mr-1 shrink-0">
                                오늘 마감
                              </span>
                            )}
                            <span className="truncate">{t.title}</span>
                          </h4>
                          {t.description && (
                            <p className={`text-[9px] text-on-surface-variant/70 truncate ${isO ? "opacity-50" : ""}`}>
                              {t.description}
                            </p>
                          )}
                          {t.dueDate && (
                            <div className="flex items-center gap-1 text-[8px] font-bold text-error/80 mt-1 select-none flex-wrap">
                              <span>마감일: {t.dueDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditTaskModal(t)}
                          className="text-on-surface-variant/40 hover:text-primary transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleTaskDelete(t.id)}
                          className="text-on-surface-variant/40 hover:text-error transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setTaskCheck(t.id, "o")}
                        className={`py-1 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer ${oClass}`}
                      >
                        O
                      </button>
                      <button
                        onClick={() => setTaskCheck(t.id, "triangle")}
                        className={`py-1 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer ${triClass}`}
                      >
                        △
                      </button>
                      <button
                        onClick={() => setTaskCheck(t.id, "x")}
                        className={`py-1 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer ${xClass}`}
                      >
                        X
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-1 gap-1 w-full">
                      {/* Timer Display */}
                      <div className="flex-1 flex items-center justify-center gap-0.5 bg-surface-container-high/30 dark:bg-[#111622] border border-surface-variant/25 rounded-lg py-0.5 px-1 transition-colors min-w-0">
                        <span
                          className={`material-symbols-outlined text-[9px] text-primary shrink-0 ${
                            isTicking ? "animate-pulse" : ""
                          }`}
                        >
                          timer
                        </span>
                        <span className="text-[8px] font-bold font-headline tabular-nums text-on-surface tracking-tighter truncate">
                          {formatTimerString(t.timeSeconds)}
                        </span>
                      </div>
                      {/* Timer Controls */}
                      <div className="flex gap-0.5 bg-surface-container-high/30 dark:bg-[#111622] border border-surface-variant/25 rounded-lg p-0.5 shrink-0 transition-colors">
                        <button
                          onClick={() => toggleStopwatch(t.id)}
                          className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shadow transition-transform active:scale-90 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[10px]">
                            {isTicking ? "pause" : "play_arrow"}
                          </span>
                        </button>
                        <button
                          onClick={() => resetTaskStopwatch(t.id)}
                          className="w-5 h-5 rounded-full bg-surface-container-highest dark:bg-neutral-850 text-on-surface-variant flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[8px]">refresh</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button
            onClick={openAddTaskModal}
            className="w-full py-2.5 border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl flex items-center justify-center gap-1 text-primary text-[10px] font-bold transition-all active:scale-[0.97] bg-primary/5 hover:bg-primary/10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[13px]">add</span>
            <span>할일/과목 추가</span>
          </button>
        </div>

        {/* Right: 24h Timetable Grid */}
        <div className="col-span-7 flex flex-col bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-2 border border-surface-variant/30 min-h-0 bubbly-shadow">
          <div className="flex items-center justify-between gap-0.5 mb-2 pb-1.5 border-b border-surface-variant/20 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold text-on-surface-variant select-none">
                브러시:
              </span>
              <div
                className="w-3 h-3 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0"
                style={{ backgroundColor: taskColor }}
              />
              <input
                type="text"
                value={taskColor}
                onChange={(e) => setTaskColor(e.target.value)}
                placeholder="#85b8b1"
                className="w-16 bg-surface-container-low border border-outline-variant/60 rounded px-1.5 py-0.5 text-[8px] font-bold text-center focus:outline-none focus:border-primary text-on-surface uppercase"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-surface-container-high rounded-full px-1 py-0.5 scale-90">
                <span className="text-[7px] font-bold text-on-surface-variant/70">텍스트</span>
                <label className="relative inline-flex items-center cursor-pointer scale-75">
                  <input
                    type="checkbox"
                    checked={isTextOn}
                    onChange={(e) => setIsTextOn(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-6 h-3.5 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center gap-0.5 bg-surface-container-high rounded-full px-1 py-0.5 scale-90">
                <span className="text-[7px] font-bold text-on-surface-variant/70">색칠</span>
                <label className="relative inline-flex items-center cursor-pointer scale-75">
                  <input
                    type="checkbox"
                    checked={isColorOn}
                    onChange={(e) => setIsColorOn(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-6 h-3.5 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar space-y-1 pb-16 select-none"
            id="timetable-scroller"
          >
            {Array.from({ length: 24 }).map((_, hour) => {
              const hourStr = String(hour).padStart(2, "0");

              // Find tasks overlapping this hour for text rendering
              const hourTasks = isColorOn
                ? allVisibleTasks.filter((task) => {
                    if (!task.startTime) return false;
                    const [sh] = task.startTime.split(":").map(Number);
                    const durationMinutes = parseDurationMinutes(task.duration);
                    const eh = Math.floor((sh * 60 + durationMinutes) / 60);
                    
                    if (hour >= sh && hour <= eh) return true;
                    if (sh * 60 + durationMinutes > 1440) {
                      const wrappedEndHour = Math.floor((sh * 60 + durationMinutes - 1440) / 60);
                      if (hour <= wrappedEndHour) return true;
                    }
                    return false;
                  })
                : [];

              return (
                <div key={hour} className="h-6 flex items-center gap-2">
                  <span className="w-3.5 text-[9px] font-bold text-on-surface-variant/50 text-right font-headline select-none">
                    {hourStr}
                  </span>
                  <div className="flex-1 h-full grid grid-cols-6 gap-px bg-neutral-200 dark:bg-neutral-700 rounded overflow-hidden relative">
                    {/* Render color block overlays from scheduled tasks */}
                    {isColorOn &&
                      allVisibleTasks.flatMap((task) => {
                        if (!task.startTime) return [];
                        const getDifficultyColor = (difficulty?: string, fallbackColor?: string) => {
                          if (difficulty === "easy") return settings.colorEasy || "#FFFACD";
                          if (difficulty === "medium") return settings.colorMedium || "#87CEFA";
                          if (difficulty === "hard") return settings.colorHard || "#FA8072";
                          return fallbackColor || "#85b8b1";
                        };

                        const [sh, sm] = task.startTime.split(":").map(Number);
                        const startTotalMinutes = sh * 60 + sm;
                        const durationMinutes = parseDurationMinutes(task.duration);
                        const endTotalMinutes = startTotalMinutes + durationMinutes;

                        const rowStartMin = hour * 60;
                        const rowEndMin = (hour + 1) * 60;

                        const blocks = [];

                        // 1. Normal interval
                        if (endTotalMinutes > rowStartMin && startTotalMinutes < rowEndMin) {
                          const interStartMin = Math.max(startTotalMinutes, rowStartMin);
                          const interEndMin = Math.min(endTotalMinutes, rowEndMin);

                          const leftPercent = ((interStartMin - rowStartMin) / 60) * 100;
                          const widthPercent = ((interEndMin - interStartMin) / 60) * 100;

                          blocks.push(
                            <div
                              key={`${task.id}_normal`}
                              className="absolute top-0 h-full rounded-sm flex items-center justify-center px-1 overflow-hidden pointer-events-none select-none z-10"
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                backgroundColor: getDifficultyColor(task.difficulty, task.color),
                                opacity: 0.9,
                              }}
                            >
                              {isTextOn && hour === sh && (
                                <span className="text-[8px] text-white font-bold truncate leading-none">
                                  {task.title}
                                </span>
                              )}
                            </div>
                          );
                        }

                        // 2. Wrapped interval (past midnight)
                        if (endTotalMinutes > 1440) {
                          const wrappedStartTotalMinutes = 0;
                          const wrappedEndTotalMinutes = endTotalMinutes - 1440;

                          if (wrappedEndTotalMinutes > rowStartMin && wrappedStartTotalMinutes < rowEndMin) {
                            const interStartMin = Math.max(wrappedStartTotalMinutes, rowStartMin);
                            const interEndMin = Math.min(wrappedEndTotalMinutes, rowEndMin);

                            const leftPercent = ((interStartMin - rowStartMin) / 60) * 100;
                            const widthPercent = ((interEndMin - interStartMin) / 60) * 100;

                            blocks.push(
                              <div
                                key={`${task.id}_wrapped`}
                                className="absolute top-0 h-full rounded-sm flex items-center justify-center px-1 overflow-hidden pointer-events-none select-none z-10"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                  backgroundColor: getDifficultyColor(task.difficulty, task.color),
                                  opacity: 0.9,
                                }}
                              >
                                {isTextOn && hour === 0 && (
                                  <span className="text-[8px] text-white font-bold truncate leading-none">
                                    {task.title}
                                  </span>
                                )}
                              </div>
                            );
                          }
                        }

                        return blocks;
                      })}

                    {/* Render Interactive Cells */}
                    {Array.from({ length: 6 }).map((_, part) => {
                      const minutesStr = String(part * 10).padStart(2, "0");
                      const cellKey = `${currentPlannerDate}_${hour}_${part}`;
                      const manualColor = timetableDrawings[cellKey];

                      // Fallback task color if drawn automatically
                      const taskColor = getTaskColorForCell(hour, part);
                      const finalColor = isColorOn ? (taskColor || manualColor) : undefined;

                      return (
                        <div
                          key={part}
                          onMouseDown={(e) => handleCellMouseDown(e, hour, part)}
                          onMouseEnter={() => handleCellMouseEnter(hour, part)}
                          onTouchStart={(e) => handleCellTouchStart(e, hour, part)}
                          onTouchMove={handleCellTouchMove}
                          onTouchEnd={handleTouchEnd}
                          data-hour={hour}
                          data-part={part}
                          className={`bg-white dark:bg-neutral-900 hover:bg-primary-container/20 transition-colors cursor-pointer border-r border-neutral-100 dark:border-neutral-800/30 last:border-0 timetable-grid-cell ${
                            finalColor ? "timetable-cell-active" : ""
                          }`}
                          style={{
                            backgroundColor: finalColor || "",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Mate mascot */}
      <div
        className="absolute z-30 select-none"
        style={{
          left: `${floatingMatePosition.x}%`,
          top: `${floatingMatePosition.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <button
          type="button"
          className="relative cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={handleFloatingMatePointerDown}
          onPointerMove={handleFloatingMatePointerMove}
          onPointerUp={handleFloatingMatePointerUp}
          aria-label="울리니 이동"
        >
          <div
            className="w-12 h-12 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/50 p-1.5 bubbly-shadow flex items-center justify-center active:scale-90 transition-transform floating-mate"
            id="floating-mate-character"
          >
            <img
              className="w-9 h-9 object-contain"
              src={getActiveMascotUrl()}
              alt="Mascot character"
            />
          </div>
        </button>
      </div>

      {/* ADD / EDIT SUBJECT MODAL DIALOG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface dark:bg-[#1a202c] rounded-3xl max-w-[340px] w-full p-5 bubbly-shadow border border-surface-variant/20 scale-100 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-headline font-bold text-base text-primary">
                  {editingTask ? "공부 계획 수정" : "공부 계획 수립 및 과목 추가"}
                </h3>
                <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                  과목별 계획 시간 및 색상을 지정하세요.
                </p>
              </div>
              <button
                className="p-1 rounded-full hover:bg-surface-container-high"
                onClick={() => setIsAddModalOpen(false)}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  과목명/내용
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="예: 수학 미적분"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  상세 계획
                </label>
                <input
                  type="text"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="예: p.120 ~ 140"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">
                    시작 시각 (선택)
                  </label>
                  <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant/60 rounded-xl px-2 py-1">
                    <input
                      type="number"
                      value={startHour}
                      onChange={(e) => handleWrapChange(e.target.value, 23, setStartHour)}
                      placeholder="09"
                      className="w-full bg-transparent border-0 p-0 text-center text-xs focus:ring-0 text-on-surface"
                    />
                    <span className="text-[10px] text-on-surface-variant">:</span>
                    <input
                      type="number"
                      value={startMin}
                      onChange={(e) => handleWrapChange(e.target.value, 59, setStartMin)}
                      placeholder="00"
                      className="w-full bg-transparent border-0 p-0 text-center text-xs focus:ring-0 text-on-surface"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">
                    예상 소요 시간
                  </label>
                  <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant/60 rounded-xl px-2 py-1">
                    <input
                      type="number"
                      value={durationHour}
                      onChange={(e) => handleWrapChange(e.target.value, 12, setDurationHour)}
                      placeholder="2"
                      className="w-full bg-transparent border-0 p-0 text-center text-xs focus:ring-0 text-on-surface"
                    />
                    <span className="text-[9px] text-on-surface-variant">h</span>
                    <input
                      type="number"
                      value={durationMin}
                      onChange={(e) => handleWrapChange(e.target.value, 59, setDurationMin)}
                      placeholder="30"
                      className="w-full bg-transparent border-0 p-0 text-center text-xs focus:ring-0 text-on-surface"
                    />
                    <span className="text-[9px] text-on-surface-variant">m</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  학습 마감일 (D-Day 알림용)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1.5">
                  과목 고유 색상
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    "#85b8b1", // Muted Mint
                    "#cab7df", // Muted Lavender
                    "#cfc48d", // Muted Yellow
                    "#9ac6dd", // Muted Sky Blue
                    "#dbafc8", // Muted Pink
                    "#9cd7b0", // Muted Green
                    "#deb78a", // Muted Orange
                    "#c5c7cb", // Muted Gray
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTaskColor(color)}
                      className={`w-5 h-5 rounded-full border-2 border-white ring-1 ring-neutral-400/20 ${
                        taskColor === color ? "scale-125 ring-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                {/* HEX 코드 직접 입력 */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-neutral-300/40 shrink-0"
                    style={{ backgroundColor: taskColor }}
                  />
                  <input
                    type="text"
                    value={taskColor}
                    onChange={(e) => setTaskColor(e.target.value)}
                    placeholder="#85b8b1"
                    className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-primary text-on-surface uppercase tracking-wide"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-surface-container-highest hover:bg-surface-dim font-bold text-on-surface-variant text-center transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleTaskSubmit}
                  className="flex-[2] py-2.5 rounded-full bg-primary bubbly-button font-bold text-white text-center transition-all cursor-pointer"
                >
                  {editingTask ? "수정 완료" : "계획 추가"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
