import { create } from "zustand";

interface TimerState {
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  isTimerRunning: boolean;
  timeElapsed: number; // in seconds
  timerIntervalId: any | null;
  startTimer: (taskId: string, taskTitle: string) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setTimerIntervalId: (id: any) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeTaskId: null,
  activeTaskTitle: null,
  isTimerRunning: false,
  timeElapsed: 0,
  timerIntervalId: null,

  startTimer: (taskId, taskTitle) => {
    // If another timer is running, clear it first
    const currentId = get().timerIntervalId;
    if (currentId) clearInterval(currentId);

    set({
      activeTaskId: taskId,
      activeTaskTitle: taskTitle,
      isTimerRunning: true,
      timeElapsed: 0,
    });
  },

  pauseTimer: () => {
    const currentId = get().timerIntervalId;
    if (currentId) clearInterval(currentId);
    set({ isTimerRunning: false, timerIntervalId: null });
  },

  resetTimer: () => {
    const currentId = get().timerIntervalId;
    if (currentId) clearInterval(currentId);
    set({
      activeTaskId: null,
      activeTaskTitle: null,
      isTimerRunning: false,
      timeElapsed: 0,
      timerIntervalId: null,
    });
  },

  tick: () => set((state) => ({ timeElapsed: state.timeElapsed + 1 })),
  
  setTimerIntervalId: (id) => set({ timerIntervalId: id }),
}));
