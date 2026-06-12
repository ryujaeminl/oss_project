export type TaskCompleted = '' | 'o' | 'triangle' | 'x';

export interface Task {
  id: number;
  title: string;
  description: string;
  timeSeconds: number;
  color: string;
  completed: TaskCompleted;
  startTime: string | null;
  duration: string;
  date: string;       // YYYY-MM-DD
  dueDate: string | null;
}

export interface ConceptNote {
  id: number;
  date: string;
  subject: string;
  content: string;
}

export interface WrongAnswer {
  id: number;
  subject: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface DayNotes {
  concepts: ConceptNote[];
  wrongAnswers: WrongAnswer[];
}

export interface Notification {
  key: string;
  text: string;
  time: string;
}

export interface Settings {
  username: string;
  goalHours: string;
  avatarUrl: string;
  activeMascot: string;
  themeColor: string;
  bgMode: string;
  cardRoundness: string;
  soundEnabled: boolean;
  customMascotUrl: string;
  deadlineAlertsEnabled: boolean;
}

export interface TimetableDrawings {
  [key: string]: string; // "date_hour_part" -> color
}

export type MoodType = '' | 'happy' | 'calm' | 'tired' | 'focus' | 'passionate';

export type TabType = 'planner' | 'calendar' | 'notes' | 'character';

export const THEME_COLORS: Record<string, { primary: string; primaryContainer: string }> = {
  mint:     { primary: '#356761', primaryContainer: '#a5d8d1' },
  lavender: { primary: '#655978', primaryContainer: '#e9d9ff' },
  yellow:   { primary: '#665f34', primaryContainer: '#eee3ad' },
  blue:     { primary: '#1d4ed8', primaryContainer: '#dbeafe' },
  pink:     { primary: '#be185d', primaryContainer: '#fce7f3' },
  green:    { primary: '#047857', primaryContainer: '#d1fae5' },
};

export const PALETTE_COLORS = [
  '#a5d8d1', '#e9d9ff', '#eee3ad', '#bae6fd',
  '#fbcfe8', '#bbf7d0', '#fed7aa', '#e5e7eb',
];

export const MASCOT_URLS: Record<string, string> = {
  'woolini': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAL7pl4zo3S5ns-o-IQp1FW_FNeH4JNl2e17Y55WQLVloGJWyPd9QAaITZh2aNHwLGSRJpYy16uKevBs3ccUc5ETPxrfb6pJRBKDOVdkCMxiWAGIw-E3Q_XXrJLvxGrWezytHz_Rmj9b5X2W3oSH7xeGEHGjhym1K5ZETUK8Fo4iWuIv0I-49l5_TYd8eaVQdaWkirZYUv7cKL9mYiqSqG530T6nJwVlZ6hHncdvTO_FEHUkxUEfJUhol9P7Vp11o3PPhzgGDp2Rj8',
  'yang-i': 'https://img.icons8.com/color/150/sheep.png',
  'gom-i':  'https://img.icons8.com/color/150/teddy-bear.png',
};
