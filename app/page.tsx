"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Cloud,
  Flame,
  Medal,
  MessageSquareQuote,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Wand2,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/language-provider";
import {
  HabitState,
  emptyHabitState,
  shareStreakText,
  todayKey,
  weeklyProgress,
  xpProgress
} from "@/lib/streak";
import { apiClient, hasAuthToken } from "@/lib/api-client";
import type { Locale } from "@/lib/i18n/messages";
import { formatSeconds } from "@/lib/utils";
import { generateSudoku, relatedCell, type Board } from "@/lib/sudoku";
import { useToast } from "@/components/ui/toast";

type ContinueGame = {
  id?: string;
  difficulty?: string;
  elapsedSeconds?: number;
  mistakes?: number;
  filledCells?: number;
  puzzle?: number[][];
  completed?: boolean;
};

type DashboardResponse = {
  fullName: string;
  username: string;
  city?: string | null;
  gamesPlayed: number;
  completedGames: number;
  bestTimeSeconds?: number | null;
  averageAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate?: string | null;
  completedDailyDates: string[];
  xp: number;
  level: number;
  xpProgress: number;
  xpNeeded: number;
  xpLeft: number;
  streakFreezes: number;
  dailyGoalCompleted: boolean;
  currentRank: string;
};

type ActiveGameResponse = {
  id: string;
  difficulty: string;
  elapsedSeconds: number;
  mistakes: number;
  currentBoard: number[][];
  status: string;
};

type DailyStatusResponse = {
  completed: boolean;
  timeSeconds?: number;
  mistakes?: number;
  accuracy?: number;
  rank: number;
};

type DailyGoal = {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
};

type DailyGoalsResponse = {
  goals: DailyGoal[];
};

type GlobalStatsResponse = {
  players: number;
  gamesToday: number;
  online: number;
};

type ActiveCity = {
  flag: string;
  city: string;
  count: number;
};

type ActiveCitiesResponse = {
  cities: ActiveCity[];
};

type DailyLeaderboardRow = {
  rank: number;
  username: string;
  city: string | null;
  timeSeconds: number;
  mistakes: number;
};

type DailyChallengeInfo = {
  difficulty?: string;
};

const dashboardCopy: Record<Locale, {
  tagline: string;
  welcomeBack: string;
  guestTitle: string;
  guestText: string;
  login: string;
  guestPlay: string;
  register: string;
  unlockTitle: string;
  unlocks: string[];
  daily: string;
  quick: string;
  bestTime: string;
  accuracy: string;
  completedGames: string;
  currentRank: string;
  starter: string;
  levelTitle: (level: number) => string;
  starterRank: string;
  weekdayLabels: string[];
  streakTitle: string;
  startToday: string;
  dayStreak: (days: number) => string;
  firstStreak: string;
  streakSafe: string;
  extendStreak: string;
  playDaily: string;
  dailyDone: string;
  continueStreak: string;
  today: string;
  longestStreak: string;
  streakFreeze: string;
  days: string;
  available: string;
  shareStreak: string;
  level: (level: number) => string;
  streakBonusValue: string;
  xpLeft: string;
  dailyChallenge: string;
  battleWin: string;
  noMistakes: string;
  streakBonus: string;
  continueGame: string;
  difficulty: string;
  time: string;
  mistakes: string;
  continue: string;
  noGame: string;
  startNewGame: string;
  todaysChallenge: string;
  completedDaily: string;
  dailyText: string;
  viewLeaderboard: string;
  quickTitle: string;
  quickText: string;
  battleTitle: string;
  battleText: string;
  startBattle: string;
  aiTitle: string;
  aiText: string;
  explainCell: string;
  themesTitle: string;
  themesText: string;
  explorePro: string;
  dailyGoal: string;
  goals: string[];
  done: string;
  completedBadge: string;
  daysToPush: (days: number) => string;
  weekly: string;
  achievements: string;
  cityTop: string;
  keepTraining: string;
  milestoneText: string;
  recommendations: {
    streak: string;
    accuracy: string;
    hard: string;
    start: string;
  };
}> = {
  en: {
    tagline: "Train your brain. One grid at a time.",
    welcomeBack: "Welcome back",
    guestTitle: "Welcome to SudokuMind",
    guestText: "Play as a guest right now, or create an account to unlock streaks, XP, saved games, profile stats and daily progress.",
    login: "Log in",
    guestPlay: "Play as guest",
    register: "Register",
    unlockTitle: "What unlocks after login?",
    unlocks: ["Personal dashboard with real backend stats", "Daily streak and XP level", "Cloud saved games", "Profile, city leaderboard and achievements"],
    daily: "Daily Challenge",
    quick: "Quick Play",
    bestTime: "Best Time",
    accuracy: "Accuracy",
    completedGames: "Completed Games",
    currentRank: "Current Rank",
    starter: "Starter",
    levelTitle: (level) => `Level ${level} Brain Trainer`,
    starterRank: "Starter",
    weekdayLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    streakTitle: "Current Streak",
    startToday: "Start today",
    dayStreak: (days) => `${days} Day Streak`,
    firstStreak: "Start your first streak today.",
    streakSafe: "Keep your brain sharp today. Your streak is protected.",
    extendStreak: "One puzzle away from extending your streak.",
    playDaily: "Play Daily Challenge",
    dailyDone: "Daily Done",
    continueStreak: "Continue Streak",
    today: "Today",
    longestStreak: "Longest streak",
    streakFreeze: "Streak Freeze",
    days: "days",
    available: "available",
    shareStreak: "Share Streak",
    level: (level) => `Level ${level} Brain Trainer`,
    xpLeft: "XP left",
    dailyChallenge: "Daily Challenge",
    battleWin: "Battle Win",
    noMistakes: "No Mistakes",
    streakBonus: "Streak Bonus",
    streakBonusValue: "+20/day",
    continueGame: "Continue Game",
    difficulty: "Difficulty",
    time: "Time",
    mistakes: "Mistakes",
    continue: "Continue",
    noGame: "No unfinished game found. Start fresh and build momentum.",
    startNewGame: "Start New Game",
    todaysChallenge: "Today's Challenge",
    completedDaily: "Completed. Your streak is safe today.",
    dailyText: "Complete today's puzzle to continue your streak.",
    viewLeaderboard: "View Leaderboard",
    quickTitle: "Quick Play",
    quickText: "Generate a fresh puzzle and keep your XP moving.",
    battleTitle: "Battle with Friends",
    battleText: "Race on the same puzzle, same timer, one winner.",
    startBattle: "Start Battle",
    aiTitle: "AI Coach",
    aiText: "Ask for strategy hints without spoiling the whole board.",
    explainCell: "Explain a Cell",
    themesTitle: "Themes",
    themesText: "Classic, Neon, Minimal, Dark Glass, Ocean and Cyberpunk skins.",
    explorePro: "Explore Pro",
    dailyGoal: "Daily Goal",
    goals: ["Complete 1 puzzle today", "Use no more than 2 hints", "Finish one Medium puzzle", "Win one Battle"],
    done: "Done",
    completedBadge: "Completed badge unlocked. XP reward claimed and streak protected.",
    daysToPush: (days) => `${days} days from your next big streak push.`,
    weekly: "Weekly Progress",
    achievements: "Recent Achievements",
    cityTop: "Top players from your city",
    keepTraining: "Keep training",
    milestoneText: "Your brain officially refuses to be average.",
    recommendations: {
      streak: "You are close to a 10-day streak. Complete today's challenge.",
      accuracy: "Your accuracy dipped recently. Try Focus Mode and use fewer guesses.",
      hard: "You usually solve Medium puzzles fastest. Try Hard today.",
      start: "Complete today's puzzle to start building a daily brain-training habit."
    }
  },
  ru: {
    tagline: "Тренируй мозг. Одна сетка за раз.",
    welcomeBack: "С возвращением",
    guestTitle: "Добро пожаловать в SudokuMind",
    guestText: "Играй как гость прямо сейчас или создай аккаунт, чтобы открыть стрики, XP, сохранённые игры, профиль и ежедневный прогресс.",
    login: "Войти",
    guestPlay: "Играть как гость",
    register: "Регистрация",
    unlockTitle: "Что откроется после входа?",
    unlocks: ["Личный dashboard с реальной статистикой backend", "Ежедневный стрик и XP уровень", "Сохранение игр в облаке", "Профиль, рейтинг города и достижения"],
    daily: "Ежедневное",
    quick: "Быстрая игра",
    bestTime: "Лучшее время",
    accuracy: "Точность",
    completedGames: "Завершено игр",
    currentRank: "Текущий ранг",
    starter: "Новичок",
    levelTitle: (level) => `Уровень ${level}`,
    starterRank: "Новичок",
    weekdayLabels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    streakTitle: "Текущий стрик",
    startToday: "Начни сегодня",
    dayStreak: (days) => `${days} дней стрика`,
    firstStreak: "Начни свой первый стрик сегодня.",
    streakSafe: "Мозг в форме. Стрик на сегодня защищён.",
    extendStreak: "Одна головоломка до продления стрика.",
    playDaily: "Играть ежедневное",
    dailyDone: "Ежедневное выполнено",
    continueStreak: "Продлить стрик",
    today: "Сегодня",
    longestStreak: "Лучший стрик",
    streakFreeze: "Защита стрика",
    days: "дней",
    available: "доступно",
    shareStreak: "Поделиться стриком",
    level: (level) => `Уровень ${level} Brain Trainer`,
    xpLeft: "XP осталось",
    dailyChallenge: "Ежедневное",
    battleWin: "Победа в битве",
    noMistakes: "Без ошибок",
    streakBonus: "Бонус стрика",
    streakBonusValue: "+20/день",
    continueGame: "Продолжить игру",
    difficulty: "Сложность",
    time: "Время",
    mistakes: "Ошибки",
    continue: "Продолжить",
    noGame: "Незавершённых игр нет. Начни новую и набери темп.",
    startNewGame: "Новая игра",
    todaysChallenge: "Сегодняшнее испытание",
    completedDaily: "Выполнено. Стрик сегодня в безопасности.",
    dailyText: "Пройди сегодняшнюю головоломку, чтобы продлить стрик.",
    viewLeaderboard: "Открыть рейтинг",
    quickTitle: "Быстрая игра",
    quickText: "Сгенерируй новую головоломку и продолжай собирать XP.",
    battleTitle: "Битва с друзьями",
    battleText: "Одна головоломка, один таймер, один победитель.",
    startBattle: "Начать битву",
    aiTitle: "AI Coach",
    aiText: "Попроси стратегическую подсказку без полного спойлера.",
    explainCell: "Объяснить клетку",
    themesTitle: "Темы",
    themesText: "Classic, Neon, Minimal, Dark Glass, Ocean и Cyberpunk скины.",
    explorePro: "Смотреть Pro",
    dailyGoal: "Цель дня",
    goals: ["Пройти 1 головоломку сегодня", "Использовать не больше 2 подсказок", "Завершить одну среднюю головоломку", "Выиграть одну битву"],
    done: "Готово",
    completedBadge: "Бейдж получен. XP начислен, стрик защищён.",
    daysToPush: (days) => `${days} дней до следующего большого рывка стрика.`,
    weekly: "Прогресс недели",
    achievements: "Последние достижения",
    cityTop: "Лучшие игроки твоего города",
    keepTraining: "Продолжить тренировку",
    milestoneText: "Твой мозг официально отказывается быть средним.",
    recommendations: {
      streak: "Ты близко к 10-дневному стрику. Пройди сегодняшний challenge.",
      accuracy: "Точность просела. Попробуй Focus Mode и меньше угадывай.",
      hard: "Medium даётся тебе быстро. Попробуй Hard сегодня.",
      start: "Пройди сегодняшнюю головоломку и начни ежедневную тренировку мозга."
    }
  },
  kk: {
    tagline: "Миды жаттықтыр. Бір тордан баста.",
    welcomeBack: "Қайта келгеніңе қуаныштымыз",
    guestTitle: "SudokuMind-қа қош келдіңіз",
    guestText: "Қазір қонақ ретінде ойна немесе стрик, XP, сақталған ойындар, профиль және күнделікті прогресс үшін аккаунт аш.",
    login: "Кіру",
    guestPlay: "Қонақ ретінде ойнау",
    register: "Тіркелу",
    unlockTitle: "Кіргеннен кейін не ашылады?",
    unlocks: ["Backend-тен нақты статистикасы бар жеке dashboard", "Күнделікті стрик және XP деңгейі", "Ойындарды бұлтта сақтау", "Профиль, қала рейтингі және жетістіктер"],
    daily: "Күнделікті",
    quick: "Жылдам ойын",
    bestTime: "Үздік уақыт",
    accuracy: "Дәлдік",
    completedGames: "Аяқталған ойындар",
    currentRank: "Қазіргі ранг",
    starter: "Бастаушы",
    levelTitle: (level) => `${level}-деңгей`,
    starterRank: "Бастаушы",
    weekdayLabels: ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"],
    streakTitle: "Қазіргі стрик",
    startToday: "Бүгін баста",
    dayStreak: (days) => `${days} күндік стрик`,
    firstStreak: "Алғашқы стрикті бүгін баста.",
    streakSafe: "Миың сергек. Бүгінгі стрик қорғалды.",
    extendStreak: "Стрикті ұзартуға бір puzzle қалды.",
    playDaily: "Күнделікті ойнау",
    dailyDone: "Күнделікті аяқталды",
    continueStreak: "Стрикті ұзарту",
    today: "Бүгін",
    longestStreak: "Ең ұзақ стрик",
    streakFreeze: "Стрик қорғанысы",
    days: "күн",
    available: "қолжетімді",
    shareStreak: "Стрикпен бөлісу",
    level: (level) => `${level}-деңгей Brain Trainer`,
    xpLeft: "XP қалды",
    dailyChallenge: "Күнделікті",
    battleWin: "Battle жеңісі",
    noMistakes: "Қатесіз",
    streakBonus: "Стрик бонусы",
    streakBonusValue: "+20/күн",
    continueGame: "Ойынды жалғастыру",
    difficulty: "Қиындық",
    time: "Уақыт",
    mistakes: "Қате",
    continue: "Жалғастыру",
    noGame: "Аяқталмаған ойын жоқ. Жаңасын бастап, қарқын ал.",
    startNewGame: "Жаңа ойын",
    todaysChallenge: "Бүгінгі сынақ",
    completedDaily: "Аяқталды. Бүгін стрик қауіпсіз.",
    dailyText: "Стрикті жалғастыру үшін бүгінгі puzzle-ды аяқта.",
    viewLeaderboard: "Рейтингті ашу",
    quickTitle: "Жылдам ойын",
    quickText: "Жаңа puzzle жасап, XP жинауды жалғастыр.",
    battleTitle: "Достармен жарыс",
    battleText: "Бір puzzle, бір таймер, бір жеңімпаз.",
    startBattle: "Battle бастау",
    aiTitle: "AI Coach",
    aiText: "Толық жауапты ашпай, стратегия hint сұра.",
    explainCell: "Ұяшықты түсіндіру",
    themesTitle: "Тақырыптар",
    themesText: "Classic, Neon, Minimal, Dark Glass, Ocean және Cyberpunk скиндері.",
    explorePro: "Pro көру",
    dailyGoal: "Күн мақсаты",
    goals: ["Бүгін 1 puzzle аяқтау", "2 hint-тен артық қолданбау", "Бір Medium puzzle аяқтау", "Бір Battle жеңу"],
    done: "Дайын",
    completedBadge: "Бейдж ашылды. XP берілді, стрик қорғалды.",
    daysToPush: (days) => `Келесі үлкен стрикке ${days} күн қалды.`,
    weekly: "Апталық прогресс",
    achievements: "Соңғы жетістіктер",
    cityTop: "Қалаңдағы үздік ойыншылар",
    keepTraining: "Жаттығуды жалғастыру",
    milestoneText: "Миың енді орташа болудан ресми түрде бас тартты.",
    recommendations: {
      streak: "10 күндік стрикке жақынсың. Бүгінгі challenge-ды аяқта.",
      accuracy: "Дәлдік төмендеді. Focus Mode қолданып, аз болжап көр.",
      hard: "Medium саған тез беріледі. Бүгін Hard байқап көр.",
      start: "Бүгінгі puzzle-ды аяқтап, күнделікті ми жаттығуын баста."
    }
  }
};

export default function HomePage() {
  const { locale } = useLanguage();
  const c = dashboardCopy[locale];
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [milestone, setMilestone] = useState<number>();

  useEffect(() => {
    async function refreshAuth() {
      const token = window.localStorage.getItem("sudokumind-access-token");
      if (!token) {
        setIsAuthed(false);
        setAuthChecked(true);
        return;
      }
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 1800);
      try {
        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": locale
          },
          signal: controller.signal
        });
        if (!response.ok) {
          window.localStorage.removeItem("sudokumind-access-token");
          window.localStorage.removeItem("sudokumind-refresh-token");
          document.cookie = "sm_access_token=; path=/; max-age=0; SameSite=Lax";
          setIsAuthed(false);
          return;
        }
        const user = await response.json();
        setIsAuthed(Boolean(user?.id || user?.email));
      } catch {
        setIsAuthed(false);
      } finally {
        window.clearTimeout(timeout);
        setAuthChecked(true);
      }
    }
    void refreshAuth();
    window.addEventListener("storage", refreshAuth);
    window.addEventListener("sudokumind-auth-updated", refreshAuth);
    return () => {
      window.removeEventListener("storage", refreshAuth);
      window.removeEventListener("sudokumind-auth-updated", refreshAuth);
    };
  }, [locale]);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    enabled: isAuthed,
    queryFn: async () => (await apiClient.get<DashboardResponse>("/users/me/dashboard")).data
  });

  const activeGameQuery = useQuery({
    queryKey: ["active-game"],
    enabled: isAuthed,
    queryFn: async () => {
      try {
        return (await apiClient.get<ActiveGameResponse>("/games/active")).data;
      } catch (error: unknown) {
        if (typeof error === "object" && error && "response" in error && (error as { response?: { status?: number } }).response?.status === 404) {
          return null;
        }
        throw error;
      }
    }
  });

  const dailyStatusQuery = useQuery({
    queryKey: ["daily-status"],
    enabled: isAuthed,
    queryFn: async () => (await apiClient.get<DailyStatusResponse>("/daily/today/status")).data
  });

  const dailyGoalsQuery = useQuery({
    queryKey: ["daily-goals"],
    enabled: isAuthed,
    queryFn: async () => (await apiClient.get<DailyGoalsResponse>("/users/me/daily-goals")).data
  });

  const globalStatsQuery = useQuery({
    queryKey: ["global-stats"],
    queryFn: async () => (await apiClient.get<GlobalStatsResponse>("/stats/global")).data,
    refetchInterval: 30000
  });

  const activeCitiesQuery = useQuery({
    queryKey: ["active-cities"],
    queryFn: async () => (await apiClient.get<ActiveCitiesResponse>("/stats/cities/active")).data,
    refetchInterval: 60000
  });

  const leaderboardQuery = useQuery({
    queryKey: ["daily-leaderboard-home"],
    queryFn: async () => (await apiClient.get<DailyLeaderboardRow[]>("/leaderboard/daily?limit=5")).data,
    refetchInterval: 60000
  });

  const dailyInfoQuery = useQuery({
    queryKey: ["daily-info"],
    queryFn: async () => (await apiClient.get<DailyChallengeInfo>("/daily/today")).data
  });

  const dashboard = dashboardQuery.data;
  const habit = useMemo<HabitState>(() => {
    if (!dashboard) return emptyHabitState();
    return {
      ...emptyHabitState(),
      currentStreak: dashboard.currentStreak,
      longestStreak: dashboard.longestStreak,
      lastPlayedDate: dashboard.lastPlayedDate ?? undefined,
      completedDailyDates: dashboard.completedDailyDates,
      xp: dashboard.xp,
      level: dashboard.level,
      streakFreezes: dashboard.streakFreezes,
      gamesCompleted: dashboard.completedGames,
      bestTimeSeconds: dashboard.bestTimeSeconds ?? undefined,
      averageAccuracy: dashboard.averageAccuracy
    };
  }, [dashboard]);

  const continueGame = useMemo<ContinueGame | null>(() => {
    if (!activeGameQuery.data) return null;
    const filledCells = activeGameQuery.data.currentBoard.flat().filter(Boolean).length;
    return {
      id: activeGameQuery.data.id,
      difficulty: activeGameQuery.data.difficulty.toLowerCase(),
      elapsedSeconds: activeGameQuery.data.elapsedSeconds,
      mistakes: activeGameQuery.data.mistakes,
      filledCells,
      completed: activeGameQuery.data.status === "COMPLETED"
    };
  }, [activeGameQuery.data]);

  const progress = xpProgress(habit);
  const week = useMemo(() => weeklyProgress(habit), [habit]);
  const completedToday = dailyStatusQuery.data?.completed ?? dashboard?.dailyGoalCompleted ?? false;
  const recommendation = useMemo(() => smartRecommendation(habit, c), [habit, c]);
  const dailyGoals = dailyGoalsQuery.data?.goals;
  const dailyGoalDone = dailyGoals?.some((goal) => goal.completed) ?? completedToday;
  const loading = authChecked && isAuthed && (dashboardQuery.isLoading || activeGameQuery.isLoading || dailyStatusQuery.isLoading);
  const username = dashboard?.fullName || dashboard?.username || "there";
  const displayedRank = !dashboard?.currentRank || dashboard.currentRank.toLowerCase() === "starter" ? c.starterRank : dashboard.currentRank;

  useEffect(() => {
    if (!isAuthed) return;
    function refreshMilestone() {
      const lastMilestone = window.localStorage.getItem("sudokumind-last-streak-milestone");
      if (lastMilestone && !window.sessionStorage.getItem(`seen-streak-${lastMilestone}`)) {
        setMilestone(Number(lastMilestone));
        window.sessionStorage.setItem(`seen-streak-${lastMilestone}`, "1");
      }
    }
    refreshMilestone();
    window.addEventListener("sudokumind-habit-updated", refreshMilestone);
    return () => window.removeEventListener("sudokumind-habit-updated", refreshMilestone);
  }, [isAuthed]);

  function copyStreak() {
    navigator.clipboard?.writeText(shareStreakText(habit));
  }

  if (loading) {
    return (
      <div className="page-shell space-y-6">
        <div className="skeleton h-24" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="skeleton h-64 lg:col-span-2" />
          <div className="skeleton h-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <GuestDashboard
        c={c}
        stats={globalStatsQuery.data}
        cities={activeCitiesQuery.data?.cities ?? []}
        leaderboard={leaderboardQuery.data ?? []}
        dailyInfo={dailyInfoQuery.data}
      />
    );
  }

  return (
    <div className="relative isolate overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div className="page-shell relative space-y-6">
        <ActiveCitiesStrip cities={activeCitiesQuery.data?.cities ?? []} />

        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge variant="outline" className="mb-3 gap-2">
              <Brain className="h-3.5 w-3.5 text-primary" />
              {c.tagline}
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{c.welcomeBack}, {username}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{recommendation}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/daily">
                <CalendarDays className="h-4 w-4" />
                {c.daily}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/play">
                <ArrowRight className="h-4 w-4" />
                {c.quick}
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_420px]">
          <StreakCard habit={habit} week={week} completedToday={completedToday} copyStreak={copyStreak} c={c} />
          <LevelCard habit={habit} progress={progress} c={c} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric icon={Trophy} label={c.bestTime} value={habit.bestTimeSeconds ? formatSeconds(habit.bestTimeSeconds) : "--:--"} />
          <DashboardMetric icon={Shield} label={c.accuracy} value={`${habit.averageAccuracy}%`} />
          <DashboardMetric icon={BarChart3} label={c.completedGames} value={habit.gamesCompleted} />
          <DashboardMetric icon={Medal} label={c.currentRank} value={displayedRank} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4 md:grid-cols-2">
            {continueGame ? <ContinueGameCard game={continueGame} c={c} /> : <StartNewGameCard c={c} />}
            <ActionCard
              icon={CalendarDays}
              title={c.todaysChallenge}
              text={
                dailyStatusQuery.data?.completed
                  ? `${c.completedDaily} · ${formatSeconds(dailyStatusQuery.data.timeSeconds ?? 0)} · ${dailyStatusQuery.data.mistakes ?? 0} ${c.mistakes.toLowerCase()} · #${dailyStatusQuery.data.rank}`
                  : c.dailyText
              }
              href="/daily"
              cta={completedToday ? c.viewLeaderboard : c.playDaily}
              glow={!completedToday}
            />
            <ActionCard icon={Zap} title={c.quickTitle} text={c.quickText} href="/play" cta={c.startNewGame} />
            <ActionCard icon={Swords} title={c.battleTitle} text={c.battleText} href="/battle" cta={c.startBattle} />
            <ActionCard icon={Wand2} title={c.aiTitle} text={c.aiText} href="/play" cta={c.explainCell} />
            <ActionCard icon={Sparkles} title={c.themesTitle} text={c.themesText} href="/pro" cta={c.explorePro} />
          </div>
          <DailyGoalCard done={dailyGoalDone} goals={dailyGoals} habit={habit} c={c} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <WeeklyChart week={week} c={c} />
          <RecentPanel habit={habit} c={c} />
        </section>
      </div>

      {milestone ? <MilestoneModal milestone={milestone} onClose={() => setMilestone(undefined)} c={c} /> : null}
    </div>
  );
}

function GuestDashboard({
  c,
  stats,
  cities,
  leaderboard,
  dailyInfo
}: {
  c: typeof dashboardCopy.en;
  stats?: GlobalStatsResponse;
  cities: ActiveCity[];
  leaderboard: DailyLeaderboardRow[];
  dailyInfo?: DailyChallengeInfo;
}) {
  return (
    <div className="relative overflow-hidden">
      <SudokuAmbientBackground />
      <div className="page-shell relative z-10 space-y-8 pt-6 sm:pt-8">
        <ActiveCitiesStrip cities={cities} />

        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-5">
            <Badge variant="outline" className="gap-2">
              <Brain className="h-3.5 w-3.5 text-primary" />
              SudokuMind
            </Badge>
            <div className="space-y-4">
              <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl">{c.guestTitle}</h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{c.guestText}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">
                  <LogInIcon />
                  {c.login}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/play">
                  <ArrowRight className="h-4 w-4" />
                  {c.guestPlay}
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">{c.register}</Link>
              </Button>
            </div>
            <LiveStats stats={stats} />
          </div>

          <MiniPlayableBoard />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <UnlockCards c={c} />
          <DailyCountdownCard dailyInfo={dailyInfo} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <DailyTopPlayers rows={leaderboard} />
          <AchievementsPreview />
        </section>

        <Testimonials />

        <footer className="flex flex-col justify-between gap-3 border-t py-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">О нас</Link>
            <Link href="#" className="hover:text-foreground">Условия</Link>
            <Link href="#" className="hover:text-foreground">Политика</Link>
          </div>
          <span className="font-mono">v1.0.0</span>
        </footer>
      </div>
    </div>
  );
}

function SudokuAmbientBackground() {
  const digits = ["1", "7", "4", "9", "2", "6", "8", "3", "5", "4", "9", "1"];
  return (
    <div className="sudoku-ambient pointer-events-none absolute inset-0 -z-10">
      <div className="premium-grid absolute inset-0" />
      <div className="absolute inset-0">
        {digits.map((digit, index) => (
          <span
            key={`${digit}-${index}`}
            className="ambient-number"
            style={{
              left: `${8 + (index % 6) * 16}%`,
              top: `${10 + Math.floor(index / 6) * 34 + (index % 2) * 8}%`,
              animationDelay: `${index * 620}ms`
            }}
          >
            {digit}
          </span>
        ))}
      </div>
    </div>
  );
}

function LiveStats({ stats }: { stats?: GlobalStatsResponse }) {
  const items = [
    { label: "игроков", value: stats?.players ?? 0, icon: "🧠" },
    { label: "игр сегодня", value: stats?.gamesToday ?? 0, icon: "⚡" },
    { label: "онлайн", value: stats?.online ?? 0, icon: "🔥" }
  ];
  return (
    <div className="grid gap-2 rounded-lg border bg-card/80 p-3 backdrop-blur sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm">
          <span>{item.icon}</span>
          <span className="font-mono text-lg font-semibold"><AnimatedNumber value={item.value} /></span>
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const startValue = displayRef.current;
    const diff = value - startValue;
    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / 700);
      const next = Math.round(startValue + diff * (1 - Math.pow(1 - progress, 3)));
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display.toLocaleString("ru-RU")}</>;
}

function ActiveCitiesStrip({ cities }: { cities: ActiveCity[] }) {
  if (cities.length === 0) return null;
  return (
    <div className="-mx-4 overflow-x-auto border-y bg-card/55 px-4 py-2 text-sm backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
      <div className="flex min-w-max items-center gap-3">
        <span className="font-medium text-muted-foreground">Сейчас играют:</span>
        {cities.map((city) => (
          <span key={city.city} className="whitespace-nowrap">
            {city.flag} {city.city} ({city.count})
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniPlayableBoard() {
  const { toast } = useToast();
  const [seed, setSeed] = useState("guest-home");
  const puzzle = useMemo(() => generateSudoku("easy", seed), [seed]);
  const [entries, setEntries] = useState<Board>(() => puzzle.puzzle.map((row) => [...row]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [winShown, setWinShown] = useState(false);

  useEffect(() => {
    setEntries(puzzle.puzzle.map((row) => [...row]));
    setSelected(null);
    setMistakes(0);
    setElapsed(0);
    setWinShown(false);
  }, [puzzle]);

  useEffect(() => {
    if (winShown) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [winShown]);

  const solved = entries.every((row, rowIndex) => row.every((value, colIndex) => value === puzzle.solution[rowIndex][colIndex]));
  const given = useMemo(() => puzzle.puzzle.map((row) => row.map(Boolean)), [puzzle.puzzle]);

  useEffect(() => {
    if (!solved || winShown) return;
    setWinShown(true);
    toast({
      title: `Отличная игра! ⏱ ${formatSeconds(elapsed)} · ${mistakes} ошибок · Зарегистрируйся чтобы войти в топ`,
      variant: "success"
    });
  }, [elapsed, mistakes, solved, toast, winShown]);

  function setDigit(digit: number) {
    if (!selected || solved) return;
    const [row, col] = selected;
    if (given[row][col]) return;
    setEntries((current) => {
      const next = current.map((item) => [...item]) as Board;
      next[row][col] = digit;
      return next;
    });
    if (puzzle.solution[row][col] !== digit) {
      setMistakes((value) => value + 1);
    }
  }

  return (
    <Card className="overflow-hidden bg-card/90 shadow-soft backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          Мини-доска
          <span className="font-mono text-sm text-muted-foreground">{formatSeconds(elapsed)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mx-auto grid w-full max-w-[360px] grid-cols-9 overflow-hidden rounded-md border">
          {entries.map((row, rowIndex) =>
            row.map((value, colIndex) => {
              const isSelected = selected?.[0] === rowIndex && selected?.[1] === colIndex;
              const isRelated = selected ? relatedCell(selected, [rowIndex, colIndex]) : false;
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  onClick={() => setSelected([rowIndex, colIndex])}
                  className={[
                    "aspect-square border bg-background/85 text-sm font-semibold transition-colors sm:text-base",
                    given[rowIndex][colIndex] ? "text-foreground" : "text-primary",
                    isRelated ? "bg-accent/70" : "",
                    isSelected ? "bg-primary text-primary-foreground" : ""
                  ].join(" ")}
                  style={{
                    borderRightWidth: colIndex === 2 || colIndex === 5 ? 2 : 1,
                    borderBottomWidth: rowIndex === 2 || rowIndex === 5 ? 2 : 1
                  }}
                >
                  {value || ""}
                </button>
              );
            })
          )}
        </div>
        <div className="grid grid-cols-9 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button key={digit} variant="secondary" className="aspect-square px-0" onClick={() => setDigit(digit)}>
              {digit}
            </Button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={() => toast({ title: "Войди чтобы сохранить" })}>Сохранить</Button>
          <Button onClick={() => setSeed(`guest-${Date.now()}`)}>Сыграть ещё</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UnlockCards({ c }: { c: typeof dashboardCopy.en }) {
  const icons = [BarChart3, Flame, Cloud, Trophy];
  const descriptions = [
    "Статистика партий, точность и лучшие времена собираются в одном месте.",
    "Ежедневный ритм, XP и прогресс уровня после каждой игры.",
    "Продолжай с любого устройства и не теряй незавершённые игры.",
    "Профиль, рейтинг города и достижения открываются после входа."
  ];
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">{c.unlockTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {c.unlocks.map((item, index) => {
          const Icon = icons[index] ?? Sparkles;
          return (
            <Card key={item} className="bg-card/85 backdrop-blur">
              <CardContent className="flex gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className={`h-5 w-5 ti ${["ti-chart-bar", "ti-flame", "ti-cloud", "ti-trophy"][index] ?? ""}`} />
                </div>
                <div>
                  <div className="font-semibold">{item}</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{descriptions[index]}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function DailyCountdownCard({ dailyInfo }: { dailyInfo?: DailyChallengeInfo }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      setSecondsLeft(Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000)));
    }
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <Card className="bg-card/85 backdrop-blur">
      <CardContent className="space-y-3 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-semibold">Новая головоломка через {formatCountdown(secondsLeft)}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Сегодня: {formatDifficulty(dailyInfo?.difficulty, dashboardCopy.ru)}. Завтрашняя сложность появится после генерации.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DailyTopPlayers({ rows }: { rows: DailyLeaderboardRow[] }) {
  return (
    <Card className="bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle>Топ игроков дня</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[48px_minmax(0,1fr)_120px_80px] gap-3 text-xs font-medium uppercase text-muted-foreground">
          <span>#</span>
          <span>Игрок · Город</span>
          <span>Время</span>
          <span>Ошибки</span>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-lg border bg-background/60 p-4 text-sm text-muted-foreground">Сегодня ещё нет результатов.</div>
        ) : rows.map((row) => (
          <motion.div
            key={`${row.rank}-${row.username}-${row.timeSeconds}`}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-[48px_minmax(0,1fr)_120px_80px] gap-3 rounded-lg border bg-background/60 p-3 text-sm"
          >
            <span className="font-mono">#{row.rank}</span>
            <span className="min-w-0 truncate">{row.username} · {row.city ?? "Мир"}</span>
            <span className="font-mono">{formatSeconds(row.timeSeconds)}</span>
            <span>{row.mistakes}</span>
          </motion.div>
        ))}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/leaderboard">
            Смотреть полный рейтинг
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function AchievementsPreview() {
  const { toast } = useToast();
  const items = [
    { icon: "🏆", title: "Решить 100 головоломок" },
    { icon: "🔥", title: "Стрик 30 дней" },
    { icon: "⚡", title: "Решить за 3 минуты" },
    { icon: "🎯", title: "Неделя без ошибок" },
    { icon: "💎", title: "Войти в топ-10" },
    { icon: "👑", title: "Победить в битве" }
  ];
  return (
    <Card className="bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle>Достижения</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            title={item.title}
            onClick={() => toast({ title: "Зарегистрируйся чтобы открыть достижения" })}
            className="group flex aspect-square items-center justify-center rounded-lg border bg-background/60 text-3xl blur-[1px] transition hover:blur-0"
          >
            {item.icon}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function Testimonials() {
  const quotes = [
    "Наконец-то судоку, где прогресс ощущается каждый день.",
    "Мини-доска на главной затянула быстрее, чем я ожидал.",
    "Стрики и рейтинг города добавили приятный азарт."
  ];
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {quotes.map((quote) => (
        <Card key={quote} className="bg-card/85 backdrop-blur">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-primary">
              <MessageSquareQuote className="h-4 w-4" />
              <span>★★★★★</span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">“{quote}”</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function LogInIcon() {
  return <ArrowRight className="h-4 w-4" />;
}

function StreakCard({
  habit,
  week,
  completedToday,
  copyStreak,
  c
}: {
  habit: HabitState;
  week: ReturnType<typeof weeklyProgress>;
  completedToday: boolean;
  copyStreak: () => void;
  c: typeof dashboardCopy.en;
}) {
  const empty = habit.currentStreak === 0;
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-card/90 shadow-soft backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <CardContent className="space-y-6 p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.8 }}
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/12 text-3xl shadow-inner"
            >
              🔥
            </motion.div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{c.streakTitle}</div>
              <div className="mt-1 text-4xl font-semibold tracking-tight">
                {empty ? c.startToday : c.dayStreak(habit.currentStreak)}
              </div>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {empty
                  ? c.firstStreak
                  : completedToday
                    ? c.streakSafe
                    : c.extendStreak}
              </p>
            </div>
          </div>
          <Button asChild variant={completedToday ? "outline" : "default"}>
            <Link href="/daily">{empty ? c.playDaily : completedToday ? c.dailyDone : c.continueStreak}</Link>
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {week.map((day, index) => (
            <div key={day.key} className="space-y-2 text-center">
              <div className="text-xs text-muted-foreground">{c.weekdayLabels[index]}</div>
              <div
                className={[
                  "mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                  day.completed ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground",
                  day.today ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                ].join(" ")}
              >
                {day.completed ? "✓" : day.today ? "•" : ""}
              </div>
            </div>
          ))}
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (week.filter((day) => day.completed).length / 7) * 100)}%` }}
            className="h-full rounded-full bg-primary"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat label={c.longestStreak} value={`${habit.longestStreak} ${c.days}`} />
          <MiniStat label={c.streakFreeze} value={`${habit.streakFreezes} ${c.available}`} />
          <Button variant="outline" onClick={copyStreak}>{c.shareStreak}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LevelCard({ habit, progress, c }: { habit: HabitState; progress: ReturnType<typeof xpProgress>; c: typeof dashboardCopy.en }) {
  return (
    <Card className="overflow-hidden bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          {c.levelTitle(habit.level)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>{progress.progress} / {progress.needed} XP</span>
            <span className="text-muted-foreground">{progress.left} {c.xpLeft}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label={c.dailyChallenge} value="+100 XP" />
          <MiniStat label={c.battleWin} value="+150 XP" />
          <MiniStat label={c.noMistakes} value="+75 XP" />
          <MiniStat label={c.streakBonus} value={c.streakBonusValue} />
        </div>
      </CardContent>
    </Card>
  );
}

function ContinueGameCard({ game, c }: { game: ContinueGame | null; c: typeof dashboardCopy.en }) {
  const progress = game?.filledCells ? Math.round((game.filledCells / 81) * 100) : 0;
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>{c.continueGame}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {game ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label={c.difficulty} value={formatDifficulty(game.difficulty, c)} />
              <MiniStat label={c.time} value={formatSeconds(game.elapsedSeconds ?? 0)} />
              <MiniStat label={c.mistakes} value={game.mistakes ?? 0} />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <Button className="w-full" asChild>
              <Link href={game.id ? `/play?gameId=${game.id}` : "/play"}>{c.continue}</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{c.noGame}</p>
            <Button className="w-full" asChild>
              <Link href="/play">{c.startNewGame}</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StartNewGameCard({ c }: { c: typeof dashboardCopy.en }) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>{c.startNewGame}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{c.noGame}</p>
        <Button className="w-full" asChild>
          <Link href="/play">{c.startNewGame}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  icon: Icon,
  title,
  text,
  href,
  cta,
  glow
}: {
  icon: typeof CalendarDays;
  title: string;
  text: string;
  href: string;
  cta: string;
  glow?: boolean;
}) {
  return (
    <motion.div whileHover={{ y: -4 }}>
      <Card className={["h-full bg-card/90 shadow-soft backdrop-blur", glow ? "border-primary/40 shadow-primary/10" : ""].join(" ")}>
        <CardContent className="space-y-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href={href}>{cta}</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DailyGoalCard({
  done,
  goals,
  habit,
  c
}: {
  done: boolean;
  goals?: DailyGoal[];
  habit: HabitState;
  c: typeof dashboardCopy.en;
}) {
  const items = goals?.length
    ? goals
    : c.goals.map((goal, index) => ({ id: goal, title: goal, xp: index === 3 ? 150 : 50, completed: done && index === 0 }));
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {c.dailyGoal}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((goal) => (
          <div key={goal.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 p-3">
            <span className={["text-sm", goal.completed ? "text-muted-foreground line-through" : ""].join(" ")}>{goal.title}</span>
            <div className="flex items-center gap-2">
              {goal.completed ? <CheckCircle2 className="daily-goal-check h-5 w-5 text-emerald-400" /> : null}
              <Badge variant={goal.completed ? "default" : "outline"}>{goal.completed ? "Получено" : `+${goal.xp} XP`}</Badge>
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm text-muted-foreground">
          {done ? c.completedBadge : c.daysToPush(Math.max(1, 10 - habit.currentStreak))}
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyChart({ week, c }: { week: ReturnType<typeof weeklyProgress>; c: typeof dashboardCopy.en }) {
  const max = Math.max(1, ...week.map((day) => day.puzzles));
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>{c.weekly}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-end gap-3">
          {week.map((day, index) => (
            <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end rounded-md bg-muted/50 p-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(8, (day.puzzles / max) * 100)}%` }}
                  className={["w-full rounded bg-primary", day.completed ? "" : "opacity-25"].join(" ")}
                />
              </div>
              <div className={["text-xs", day.today ? "font-semibold text-primary" : "text-muted-foreground"].join(" ")}>
                {c.weekdayLabels[index]}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentPanel({ habit, c }: { habit: HabitState; c: typeof dashboardCopy.en }) {
  const topPlayers = ["Aruzhan", "Nfactorial", "Meirzhan"];
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>{c.achievements}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[3, 7, 14, 30, 100].map((item) => (
            <Badge key={item} variant={habit.longestStreak >= item ? "default" : "outline"}>
              {item === 100 ? "100 Day Legend" : `${item} Day Streak`}
            </Badge>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">{c.cityTop}</div>
          {topPlayers.map((player, index) => (
            <div key={player} className="flex items-center justify-between rounded-lg border bg-background/60 p-3 text-sm">
              <span>#{index + 1} {player}</span>
              <span className="font-mono text-muted-foreground">{formatSeconds(276 + index * 26)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardMetric({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string | number }) {
  return (
    <Card className="bg-card/90 shadow-sm backdrop-blur">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function MilestoneModal({ milestone, onClose, c }: { milestone: number; onClose: () => void; c: typeof dashboardCopy.en }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 backdrop-blur">
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="overflow-hidden border-primary/30 shadow-soft">
          <CardContent className="space-y-5 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">🔥</div>
            <div>
              <h2 className="text-2xl font-semibold">{milestone} Day Streak!</h2>
              <p className="mt-2 text-muted-foreground">{c.milestoneText}</p>
            </div>
            <Button className="w-full" onClick={onClose}>{c.keepTraining}</Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function smartRecommendation(habit: HabitState, c: typeof dashboardCopy.en) {
  if (habit.currentStreak >= 7 && !habit.completedDailyDates.includes(todayKey())) {
    return c.recommendations.streak;
  }
  if (habit.averageAccuracy < 90) {
    return c.recommendations.accuracy;
  }
  if (habit.gamesCompleted > 3) {
    return c.recommendations.hard;
  }
  return c.recommendations.start;
}

function formatDifficulty(difficulty: string | undefined, c: typeof dashboardCopy.en) {
  const value = difficulty?.toLowerCase();
  if (value === "easy") return c === dashboardCopy.ru ? "Лёгкая" : c === dashboardCopy.kk ? "Оңай" : "Easy";
  if (value === "medium") return c === dashboardCopy.ru ? "Средняя" : c === dashboardCopy.kk ? "Орташа" : "Medium";
  if (value === "hard") return c === dashboardCopy.ru ? "Сложная" : c === dashboardCopy.kk ? "Қиын" : "Hard";
  if (value === "expert") return c === dashboardCopy.ru ? "Эксперт" : c === dashboardCopy.kk ? "Эксперт" : "Expert";
  return difficulty ?? (c === dashboardCopy.ru ? "Средняя" : c === dashboardCopy.kk ? "Орташа" : "Medium");
}

function formatCountdown(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
