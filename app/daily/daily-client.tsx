"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Clipboard, MapPin } from "lucide-react";
import { SudokuGame } from "@/app/play/sudoku-game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { HabitState, emptyHabitState, loadHabitState, shareStreakText } from "@/lib/streak";
import { formatSeconds } from "@/lib/utils";

type LeaderboardRow = {
  rank: number;
  username: string;
  city: string | null;
  elapsed_seconds: number;
  mistakes: number;
  is_pro: boolean;
};

type BackendDailyChallenge = {
  id: string;
};

type BackendLeaderboardRow = {
  rank: number;
  username: string;
  city: string | null;
  timeSeconds: number;
  mistakes: number;
  isPro: boolean;
};

type DailyStatus = {
  completed: boolean;
  timeSeconds?: number;
  mistakes?: number;
  rank: number;
};

export function DailyClient() {
  const { t } = useLanguage();
  const [city, setCity] = useState("");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [challengeId, setChallengeId] = useState<string>();
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [habit, setHabit] = useState<HabitState>(() => emptyHabitState());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const refresh = () => setHabit(loadHabitState());
    refresh();
    window.addEventListener("sudokumind-habit-updated", refresh);
    return () => window.removeEventListener("sudokumind-habit-updated", refresh);
  }, []);

  useEffect(() => {
    fetch(`/api/daily/today`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: BackendDailyChallenge | null) => setChallengeId(data?.id))
      .catch(() => undefined);

    const token = window.localStorage.getItem("sudokumind-access-token");
    if (!token) return;
    fetch("/api/daily/today/status", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DailyStatus | null) => setStatus(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!challengeId) return;
    const token = window.localStorage.getItem("sudokumind-access-token");
    if (!token) return;

    const params = new URLSearchParams();
    if (city) params.set("city", city);
    const query = params.toString();

    fetch(`/api/daily/${challengeId}/leaderboard${query ? `?${query}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: BackendLeaderboardRow[]) =>
        setRows(
          data.map((row) => ({
            rank: row.rank,
            username: row.username,
            city: row.city,
            elapsed_seconds: row.timeSeconds,
            mistakes: row.mistakes,
            is_pro: row.isPro
          }))
        )
      )
      .catch(() => setRows([]));
  }, [challengeId, city]);

  const countdown = useMemo(() => {
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return formatCountdown(Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000)));
  }, [now]);

  function copyStreak() {
    navigator.clipboard?.writeText(shareStreakText(habit));
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">{t("daily.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("daily.subtitle")}</p>
        </div>
        <Badge variant="outline" className="w-fit font-mono">
          {t("daily.next")}: {countdown}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {status?.completed ? (
          <Card className="border-primary/30 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                Пройдено
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-background/60 p-4">
                  <div className="text-sm text-muted-foreground">Время</div>
                  <div className="font-mono text-xl font-semibold">{formatSeconds(status.timeSeconds ?? 0)}</div>
                </div>
                <div className="rounded-lg border bg-background/60 p-4">
                  <div className="text-sm text-muted-foreground">Ошибки</div>
                  <div className="font-mono text-xl font-semibold">{status.mistakes ?? 0}</div>
                </div>
                <div className="rounded-lg border bg-background/60 p-4">
                  <div className="text-sm text-muted-foreground">Рейтинг</div>
                  <div className="font-mono text-xl font-semibold">#{status.rank}</div>
                </div>
              </div>
              <Button asChild>
                <a href="#daily-leaderboard">Смотреть рейтинг →</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <SudokuGame daily dailyChallengeId={challengeId} />
        )}
        <Card id="daily-leaderboard">
          <CardHeader>
            <CardTitle>{t("daily.leaderboard")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <MapPin className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={t("daily.filterCity")}
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={`${row.rank}-${row.username}`} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      #{row.rank} {row.username}
                      {row.is_pro ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
                    </div>
                    <div className="text-muted-foreground">{row.city ?? t("daily.global")}</div>
                  </div>
                  <div className="text-end font-mono">
                    <div>{formatSeconds(row.elapsed_seconds)}</div>
                    <div className="text-muted-foreground">{row.mistakes} {t("common.mistakes").toLowerCase()}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={copyStreak}>
              <Clipboard className="h-4 w-4" />
              Share Streak
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatCountdown(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
