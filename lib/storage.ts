import type {
  DailyLog,
  DailyTotals,
  DetectedFoodItem,
  MealLogEntry,
  MicroTargets,
  UserProfile,
} from "./types";

/**
 * Local persistence layer (localStorage-backed).
 * Swap the bodies of these functions for API calls if/when a backend is added —
 * every call site in the app only depends on this module's exported signatures.
 */

const KEYS = {
  profile: "nutrivision:profile",
  logs: "nutrivision:logs",
} as const;

const UPDATE_EVENT = "nutrivision:update";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { key } }));
}

/** Subscribe to any local storage mutation made through this module. */
export function subscribeToUpdates(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => callback();
  window.addEventListener(UPDATE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(UPDATE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function todayKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toDateKey(d);
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(dateKey: string): string {
  const today = todayKey();
  const yesterday = todayKey(-1);
  if (dateKey === today) return "Today";
  if (dateKey === yesterday) return "Yesterday";
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatChartDayLabel(dateKey: string): string {
  const label = formatDateLabel(dateKey);
  if (label === "Today" || label === "Yesterday") return label;
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" });
}

/** Heading for a day, e.g. "Today", "Yesterday", "Wednesday". */
export function formatDayHeading(dateKey: string): string {
  const label = formatDateLabel(dateKey);
  if (label === "Today" || label === "Yesterday") return label;
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long" });
}

// ---- Profile ----

export function getProfile(): UserProfile | null {
  return readJSON<UserProfile | null>(KEYS.profile, null);
}

export function saveProfile(profile: UserProfile): void {
  writeJSON(KEYS.profile, profile);
}

export function clearProfile(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEYS.profile);
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { key: KEYS.profile } }));
}

// ---- Daily logs ----

type LogsByDate = Record<string, DailyLog>;

function getAllLogs(): LogsByDate {
  return readJSON<LogsByDate>(KEYS.logs, {});
}

function saveAllLogs(logs: LogsByDate): void {
  writeJSON(KEYS.logs, logs);
}

export function getDailyLog(date: string): DailyLog {
  const logs = getAllLogs();
  return logs[date] ?? { date, meals: [] };
}

export function addMealEntry(entry: MealLogEntry): void {
  const logs = getAllLogs();
  const existing = logs[entry.date] ?? { date: entry.date, meals: [] };
  existing.meals = [...existing.meals, entry];
  logs[entry.date] = existing;
  saveAllLogs(logs);
}

export function removeMealEntry(date: string, mealId: string): void {
  const logs = getAllLogs();
  const existing = logs[date];
  if (!existing) return;
  existing.meals = existing.meals.filter((m) => m.id !== mealId);
  logs[date] = existing;
  saveAllLogs(logs);
}

export function updateMealItems(date: string, mealId: string, items: DetectedFoodItem[]): void {
  updateMealEntry(date, mealId, { items });
}

export function updateMealEntry(
  date: string,
  mealId: string,
  patch: Partial<Pick<MealLogEntry, "mealName" | "mealType" | "items" | "imageUrl">>
): void {
  const logs = getAllLogs();
  const existing = logs[date];
  if (!existing) return;
  existing.meals = existing.meals.map((m) => (m.id === mealId ? { ...m, ...patch } : m));
  logs[date] = existing;
  saveAllLogs(logs);
}

export function getLogsInRange(days: number): DailyLog[] {
  const result: DailyLog[] = [];
  for (let i = days - 1; i >= 0; i--) {
    result.push(getDailyLog(todayKey(-i)));
  }
  return result;
}

const EMPTY_MICROS: MicroTargets = {
  vitaminA_mcg: 0,
  vitaminC_mg: 0,
  vitaminD_IU: 0,
  vitaminB12_mcg: 0,
  iron_mg: 0,
  calcium_mg: 0,
  potassium_mg: 0,
  sodium_mg: 0,
};

export function computeDailyTotals(log: DailyLog): DailyTotals {
  const totals: DailyTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar_g: 0,
    cholesterol_mg: 0,
    micros: { ...EMPTY_MICROS },
  };

  for (const meal of log.meals) {
    for (const item of meal.items) {
      totals.calories += item.calories;
      totals.protein += item.protein;
      totals.carbs += item.carbs;
      totals.fat += item.fat;
      totals.fiber += item.fiber;
      totals.sugar_g += item.sugar_g ?? 0;
      totals.cholesterol_mg += item.minerals.cholesterol_mg ?? 0;
      totals.micros.vitaminA_mcg += item.vitamins.vitaminA_mcg;
      totals.micros.vitaminC_mg += item.vitamins.vitaminC_mg;
      totals.micros.vitaminD_IU += item.vitamins.vitaminD_IU;
      totals.micros.vitaminB12_mcg += item.vitamins.vitaminB12_mcg;
      totals.micros.iron_mg += item.minerals.iron_mg;
      totals.micros.calcium_mg += item.minerals.calcium_mg;
      totals.micros.potassium_mg += item.minerals.potassium_mg;
      totals.micros.sodium_mg += item.minerals.sodium_mg;
    }
  }

  return totals;
}

export function generateId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
