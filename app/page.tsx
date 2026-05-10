"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
  Flame,
  Medal,
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
import {
  HabitState,
  emptyHabitState,
  loadHabitState,
  shareStreakText,
  todayKey,
  weeklyProgress,
  xpProgress
} from "@/lib/streak";
import { formatSeconds } from "@/lib/utils";

type ContinueGame = {
  difficulty?: string;
  elapsed_seconds?: number;
  mistakes?: number;
  entries?: number[][];
  puzzle?: number[][];
  completed?: boolean;
};

export default function HomePage() {
  const [habit, setHabit] = useState<HabitState>(() => emptyHabitState());
  const [loading, setLoading] = useState(true);
  const [continueGame, setContinueGame] = useState<ContinueGame | null>(null);
  const [username, setUsername] = useState("Meirzhan");
  const [milestone, setMilestone] = useState<number>();
  const progress = xpProgress(habit);
  const week = useMemo(() => weeklyProgress(habit), [habit]);
  const completedToday = habit.completedDailyDates.includes(todayKey());
  const recommendation = useMemo(() => smartRecommendation(habit), [habit]);
  const dailyGoalDone = completedToday || habit.gamesCompleted > 0;

  useEffect(() => {
    function refresh() {
      const next = loadHabitState();
      setHabit(next);
      setUsername(window.localStorage.getItem("sudokumind-username") ?? "Meirzhan");
      const rawGame = window.localStorage.getItem("sudokumind-current-game");
      if (rawGame) {
        try {
          const parsed = JSON.parse(rawGame) as ContinueGame;
          setContinueGame(parsed.completed ? null : parsed);
        } catch {
          setContinueGame(null);
        }
      }
      const lastMilestone = window.localStorage.getItem("sudokumind-last-streak-milestone");
      if (lastMilestone && !window.sessionStorage.getItem(`seen-streak-${lastMilestone}`)) {
        setMilestone(Number(lastMilestone));
        window.sessionStorage.setItem(`seen-streak-${lastMilestone}`, "1");
      }
      setLoading(false);
    }

    refresh();
    window.addEventListener("sudokumind-habit-updated", refresh);
    return () => window.removeEventListener("sudokumind-habit-updated", refresh);
  }, []);

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

  return (
    <div className="relative overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div className="page-shell relative space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge variant="outline" className="mb-3 gap-2">
              <Brain className="h-3.5 w-3.5 text-primary" />
              Train your brain. One grid at a time.
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Welcome back, {username}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{recommendation}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/daily">
                <CalendarDays className="h-4 w-4" />
                Daily Challenge
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/play">
                <ArrowRight className="h-4 w-4" />
                Quick Play
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_420px]">
          <StreakCard habit={habit} week={week} completedToday={completedToday} copyStreak={copyStreak} />
          <LevelCard habit={habit} progress={progress} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric icon={Trophy} label="Best Time" value={habit.bestTimeSeconds ? formatSeconds(habit.bestTimeSeconds) : "--:--"} />
          <DashboardMetric icon={Shield} label="Accuracy" value={`${habit.averageAccuracy}%`} />
          <DashboardMetric icon={BarChart3} label="Completed Games" value={habit.gamesCompleted} />
          <DashboardMetric icon={Medal} label="Current Rank" value={habit.currentStreak >= 7 ? "Gold II" : "Silver I"} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4 md:grid-cols-2">
            <ContinueGameCard game={continueGame} />
            <ActionCard
              icon={CalendarDays}
              title="Today's Challenge"
              text={completedToday ? "Completed. Your streak is safe today." : "Complete today’s puzzle to continue your streak."}
              href="/daily"
              cta={completedToday ? "View Leaderboard" : "Start Daily Challenge"}
              glow={!completedToday}
            />
            <ActionCard icon={Zap} title="Quick Play" text="Generate a fresh puzzle and keep your XP moving." href="/play" cta="Start New Game" />
            <ActionCard icon={Swords} title="Battle with Friends" text="Race on the same puzzle, same timer, one winner." href="/battle" cta="Start Battle" />
            <ActionCard icon={Wand2} title="AI Coach" text="Ask for strategy hints without spoiling the whole board." href="/play" cta="Explain a Cell" />
            <ActionCard icon={Sparkles} title="Themes" text="Classic, Neon, Minimal, Dark Glass, Ocean and Cyberpunk skins." href="/pro" cta="Explore Pro" />
          </div>
          <DailyGoalCard done={dailyGoalDone} habit={habit} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <WeeklyChart week={week} />
          <RecentPanel habit={habit} />
        </section>
      </div>

      {milestone ? <MilestoneModal milestone={milestone} onClose={() => setMilestone(undefined)} /> : null}
    </div>
  );
}

function StreakCard({
  habit,
  week,
  completedToday,
  copyStreak
}: {
  habit: HabitState;
  week: ReturnType<typeof weeklyProgress>;
  completedToday: boolean;
  copyStreak: () => void;
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
              <div className="text-sm font-medium text-muted-foreground">Current Streak</div>
              <div className="mt-1 text-4xl font-semibold tracking-tight">
                {empty ? "Start today" : `${habit.currentStreak} Day Streak`}
              </div>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {empty
                  ? "Start your first streak today."
                  : completedToday
                    ? "Keep your brain sharp today. Your streak is protected."
                    : "One puzzle away from extending your streak."}
              </p>
            </div>
          </div>
          <Button asChild variant={completedToday ? "outline" : "default"}>
            <Link href="/daily">{empty ? "Play Daily Challenge" : completedToday ? "Daily Done" : "Continue Streak"}</Link>
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {week.map((day) => (
            <div key={day.key} className="space-y-2 text-center">
              <div className="text-xs text-muted-foreground">{day.label}</div>
              <div
                className={[
                  "mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                  day.completed ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground",
                  day.today ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                ].join(" ")}
              >
                {day.completed ? "✓" : day.today ? "Today" : ""}
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
          <MiniStat label="Longest streak" value={`${habit.longestStreak} days`} />
          <MiniStat label="Streak Freeze" value={`${habit.streakFreezes} available`} />
          <Button variant="outline" onClick={copyStreak}>Share Streak</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LevelCard({ habit, progress }: { habit: HabitState; progress: ReturnType<typeof xpProgress> }) {
  return (
    <Card className="overflow-hidden bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Level {habit.level} Brain Trainer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>{progress.progress} / {progress.needed} XP</span>
            <span className="text-muted-foreground">{progress.left} XP left</span>
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
          <MiniStat label="Daily Challenge" value="+100 XP" />
          <MiniStat label="Battle Win" value="+150 XP" />
          <MiniStat label="No Mistakes" value="+75 XP" />
          <MiniStat label="Streak Bonus" value="+20/day" />
        </div>
      </CardContent>
    </Card>
  );
}

function ContinueGameCard({ game }: { game: ContinueGame | null }) {
  const progress = game?.entries ? Math.round((game.entries.flat().filter(Boolean).length / 81) * 100) : 0;
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>Continue Game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {game ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Difficulty" value={game.difficulty ?? "Medium"} />
              <MiniStat label="Time" value={formatSeconds(game.elapsed_seconds ?? 0)} />
              <MiniStat label="Mistakes" value={game.mistakes ?? 0} />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <Button className="w-full" asChild>
              <Link href="/play">Continue</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">No unfinished game found. Start fresh and build momentum.</p>
            <Button className="w-full" asChild>
              <Link href="/play">Start New Game</Link>
            </Button>
          </>
        )}
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

function DailyGoalCard({ done, habit }: { done: boolean; habit: HabitState }) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Daily Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          "Complete 1 puzzle today",
          "Use no more than 2 hints",
          "Finish one Medium puzzle",
          "Win one Battle"
        ].map((goal, index) => (
          <div key={goal} className="flex items-center justify-between rounded-lg border bg-background/60 p-3">
            <span className="text-sm">{goal}</span>
            <Badge variant={done && index === 0 ? "default" : "outline"}>{done && index === 0 ? "Done" : `+${index === 3 ? 150 : 50} XP`}</Badge>
          </div>
        ))}
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm text-muted-foreground">
          {done ? "Completed badge unlocked. XP reward claimed and streak protected." : `${Math.max(1, 10 - habit.currentStreak)} days from your next big streak push.`}
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyChart({ week }: { week: ReturnType<typeof weeklyProgress> }) {
  const max = Math.max(1, ...week.map((day) => day.puzzles));
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-end gap-3">
          {week.map((day) => (
            <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end rounded-md bg-muted/50 p-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(8, (day.puzzles / max) * 100)}%` }}
                  className={["w-full rounded bg-primary", day.completed ? "" : "opacity-25"].join(" ")}
                />
              </div>
              <div className={["text-xs", day.today ? "font-semibold text-primary" : "text-muted-foreground"].join(" ")}>
                {day.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentPanel({ habit }: { habit: HabitState }) {
  const topPlayers = ["Aruzhan", "Nfactorial", "Meirzhan"];
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>Recent Achievements</CardTitle>
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
          <div className="text-sm font-medium">Top players from your city</div>
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

function MilestoneModal({ milestone, onClose }: { milestone: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 backdrop-blur">
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="overflow-hidden border-primary/30 shadow-soft">
          <CardContent className="space-y-5 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">🔥</div>
            <div>
              <h2 className="text-2xl font-semibold">{milestone} Day Streak!</h2>
              <p className="mt-2 text-muted-foreground">Your brain officially refuses to be average.</p>
            </div>
            <Button className="w-full" onClick={onClose}>Keep training</Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function smartRecommendation(habit: HabitState) {
  if (habit.currentStreak >= 7 && !habit.completedDailyDates.includes(todayKey())) {
    return "You are close to a 10-day streak. Complete today’s challenge.";
  }
  if (habit.averageAccuracy < 90) {
    return "Your accuracy dipped recently. Try Focus Mode and use fewer guesses.";
  }
  if (habit.gamesCompleted > 3) {
    return "You usually solve Medium puzzles fastest. Try Hard today.";
  }
  return "Complete today’s puzzle to start building a daily brain-training habit.";
}
