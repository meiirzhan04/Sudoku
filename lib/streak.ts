import { formatSeconds } from "@/lib/utils";

export type DailyCompletion = {
  date: string;
  timeSeconds: number;
  mistakes: number;
  accuracy: number;
  rank?: number;
};

export type HabitState = {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate?: string;
  completedDailyDates: string[];
  completions: DailyCompletion[];
  xp: number;
  level: number;
  streakFreezes: number;
  protectedDates: string[];
  milestonesUnlocked: number[];
  gamesCompleted: number;
  bestTimeSeconds?: number;
  averageAccuracy: number;
};

export type XpEvent = "game" | "daily" | "battleWin" | "noMistake" | "hardBonus" | "streakBonus";

const storageKey = "sudokumind-habit-state";
const xpByEvent: Record<XpEvent, number> = {
  game: 50,
  daily: 100,
  battleWin: 150,
  noMistake: 75,
  hardBonus: 100,
  streakBonus: 20
};

export const streakMilestones = [3, 7, 14, 30, 100];

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function emptyHabitState(): HabitState {
  return {
    currentStreak: 0,
    longestStreak: 0,
    completedDailyDates: [],
    completions: [],
    xp: 0,
    level: 1,
    streakFreezes: 0,
    protectedDates: [],
    milestonesUnlocked: [],
    gamesCompleted: 0,
    averageAccuracy: 100
  };
}

export function loadHabitState(): HabitState {
  if (typeof window === "undefined") return emptyHabitState();
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return emptyHabitState();

  try {
    return { ...emptyHabitState(), ...(JSON.parse(raw) as HabitState) };
  } catch {
    return emptyHabitState();
  }
}

export function saveHabitState(state: HabitState) {
  if (typeof window === "undefined") return state;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("sudokumind-habit-updated", { detail: state }));
  return state;
}

export function xpForLevel(level: number) {
  return level * 1000;
}

export function xpProgress(state: HabitState) {
  const currentLevelStart = Array.from({ length: Math.max(0, state.level - 1) }).reduce<number>(
    (sum, _, index) => sum + xpForLevel(index + 1),
    0
  );
  const nextLevelXp = xpForLevel(state.level);
  const progress = Math.max(0, state.xp - currentLevelStart);
  return {
    progress,
    needed: nextLevelXp,
    left: Math.max(0, nextLevelXp - progress),
    percent: Math.min(100, Math.round((progress / nextLevelXp) * 100))
  };
}

export function addXp(state: HabitState, amount: number) {
  let next = { ...state, xp: state.xp + amount };
  let progress = xpProgress(next);
  while (progress.progress >= progress.needed) {
    next = { ...next, level: next.level + 1 };
    progress = xpProgress(next);
  }
  return next;
}

export function awardXp(event: XpEvent, multiplier = 1) {
  const state = loadHabitState();
  return saveHabitState(addXp(state, xpByEvent[event] * multiplier));
}

function dayDiff(previous: string, next: string) {
  const previousDate = new Date(`${previous}T00:00:00.000Z`).getTime();
  const nextDate = new Date(`${next}T00:00:00.000Z`).getTime();
  return Math.round((nextDate - previousDate) / 86400000);
}

export function completeDailyChallenge(completion: Omit<DailyCompletion, "date"> & { date?: string }) {
  const date = completion.date ?? todayKey();
  const state = loadHabitState();
  if (state.completedDailyDates.includes(date)) {
    return { state, alreadyCompleted: true, newMilestone: undefined as number | undefined, protectedByFreeze: false };
  }

  const diff = state.lastPlayedDate ? dayDiff(state.lastPlayedDate, date) : 0;
  let protectedByFreeze = false;
  let nextStreak = 1;
  let streakFreezes = state.streakFreezes;
  const protectedDates = [...state.protectedDates];

  if (!state.lastPlayedDate || diff <= 0) {
    nextStreak = Math.max(1, state.currentStreak || 1);
  } else if (diff === 1) {
    nextStreak = state.currentStreak + 1;
  } else if (diff === 2 && streakFreezes > 0) {
    nextStreak = state.currentStreak + 1;
    streakFreezes -= 1;
    protectedByFreeze = true;
    protectedDates.push(date);
  }

  const completions = [
    { date, timeSeconds: completion.timeSeconds, mistakes: completion.mistakes, accuracy: completion.accuracy, rank: completion.rank },
    ...state.completions
  ].slice(0, 30);
  const averageAccuracy = Math.round(
    completions.reduce((sum, item) => sum + item.accuracy, 0) / Math.max(1, completions.length)
  );
  const bestTimeSeconds = Math.min(
    completion.timeSeconds,
    state.bestTimeSeconds ?? Number.MAX_SAFE_INTEGER
  );
  const unlocked = streakMilestones.find(
    (milestone) => nextStreak >= milestone && !state.milestonesUnlocked.includes(milestone)
  );

  const withCompletion: HabitState = {
    ...state,
    currentStreak: nextStreak,
    longestStreak: Math.max(state.longestStreak, nextStreak),
    lastPlayedDate: date,
    completedDailyDates: [...state.completedDailyDates, date],
    completions,
    streakFreezes,
    protectedDates,
    milestonesUnlocked: unlocked ? [...state.milestonesUnlocked, unlocked] : state.milestonesUnlocked,
    gamesCompleted: state.gamesCompleted + 1,
    bestTimeSeconds,
    averageAccuracy
  };
  const withXp = addXp(
    withCompletion,
    xpByEvent.daily + nextStreak * xpByEvent.streakBonus + (completion.mistakes === 0 ? xpByEvent.noMistake : 0)
  );

  if (typeof window !== "undefined" && unlocked) {
    window.localStorage.setItem("sudokumind-last-streak-milestone", String(unlocked));
  }

  return {
    state: saveHabitState(withXp),
    alreadyCompleted: false,
    newMilestone: unlocked,
    protectedByFreeze
  };
}

export function recordCompletedGame(args: { elapsedSeconds: number; mistakes: number; accuracy: number; difficulty: string }) {
  const state = loadHabitState();
  const bonus = ["hard", "expert", "insane"].includes(args.difficulty) ? xpByEvent.hardBonus : 0;
  const noMistake = args.mistakes === 0 ? xpByEvent.noMistake : 0;
  const gamesCompleted = state.gamesCompleted + 1;
  const averageAccuracy = Math.round(
    (state.averageAccuracy * state.gamesCompleted + args.accuracy) / Math.max(1, gamesCompleted)
  );
  return saveHabitState(
    addXp(
      {
        ...state,
        gamesCompleted,
        averageAccuracy,
        bestTimeSeconds: Math.min(args.elapsedSeconds, state.bestTimeSeconds ?? Number.MAX_SAFE_INTEGER)
      },
      xpByEvent.game + bonus + noMistake
    )
  );
}

export function weeklyProgress(state: HabitState, baseDate = new Date()) {
  const start = new Date(baseDate);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = todayKey(date);
    const completion = state.completions.find((item) => item.date === key);
    return {
      key,
      label: date.toLocaleDateString("en", { weekday: "short" }),
      completed: state.completedDailyDates.includes(key),
      today: key === todayKey(baseDate),
      puzzles: completion ? 1 : 0,
      accuracy: completion?.accuracy ?? 0,
      time: completion?.timeSeconds ?? 0
    };
  });
}

export function shareStreakText(state: HabitState, city = "Almaty") {
  const latest = state.completions[0];
  return [
    "SudokuMind",
    `Streak: ${state.currentStreak} day${state.currentStreak === 1 ? "" : "s"}`,
    `Today's time: ${latest ? formatSeconds(latest.timeSeconds) : "--:--"}`,
    `Mistakes: ${latest?.mistakes ?? 0}`,
    `Accuracy: ${latest?.accuracy ?? state.averageAccuracy}%`,
    `Rank: #${latest?.rank ?? 12} in ${city}`
  ].join("\n");
}
