// ─── KST Date Utilities ───────────────────────────────────────────────

export function getKSTParts() {
  const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
  const kstDate = new Date(utc + 3600000 * 9);
  return {
    year: kstDate.getFullYear(),
    month: kstDate.getMonth(),
    day: kstDate.getDate(),
    hour: kstDate.getHours(),
    minute: kstDate.getMinutes(),
    second: kstDate.getSeconds(),
  };
}

export function getKSTDate(): Date {
  const kst = getKSTParts();
  return new Date(kst.year, kst.month, kst.day, kst.hour, kst.minute, kst.second);
}

export function getKSTDateString(dateObj?: Date): string {
  const d = dateObj ?? getKSTDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ─── Duration Parsing ──────────────────────────────────────────────────

export function parseDurationMinutes(duration: string | number | null | undefined): number {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;
  const s = String(duration);
  if (/^\d+$/.test(s)) return parseInt(s);

  let dh = 0, dm = 0;
  const hM = s.match(/(\d+)\s*시간/);
  const mM = s.match(/(\d+)\s*분/);
  if (hM) dh = parseInt(hM[1]);
  if (mM) dm = parseInt(mM[1]);

  const hE = s.match(/(\d+)\s*h/i);
  const mE = s.match(/(\d+)\s*m/i);
  if (hE) dh = parseInt(hE[1]);
  if (mE) dm = parseInt(mE[1]);

  return dh * 60 + dm;
}

// ─── Timer Formatting ──────────────────────────────────────────────────

export function formatTimerString(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

// ─── D-Day Calculation ─────────────────────────────────────────────────

export function getDDayString(dueDate: string | null, currentDate: string): string {
  if (!dueDate) return '';
  const due = parseLocalDate(dueDate);
  const curr = parseLocalDate(currentDate);
  due.setHours(0, 0, 0, 0);
  curr.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - curr.getTime()) / 86400000);
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

// ─── HTML Escape ───────────────────────────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
