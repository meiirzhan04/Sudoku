"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, MapPin } from "lucide-react";
import { SudokuGame } from "@/app/play/sudoku-game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/language-provider";
import { dailySeed } from "@/lib/sudoku";
import { formatSeconds } from "@/lib/utils";

type LeaderboardRow = {
  rank: number;
  username: string;
  city: string | null;
  elapsed_seconds: number;
  mistakes: number;
  is_pro: boolean;
};

export function DailyClient() {
  const { t } = useLanguage();
  const [city, setCity] = useState("");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [now, setNow] = useState(() => new Date());
  const date = dailySeed();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ date });
    if (city) params.set("city", city);
    fetch(`/api/daily/leaderboard?${params}`).then((res) => res.json()).then((data) => setRows(data.rows ?? []));
  }, [city, date]);

  const countdown = useMemo(() => {
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return formatSeconds(Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000)));
  }, [now]);

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
        <SudokuGame daily />
        <Card>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
