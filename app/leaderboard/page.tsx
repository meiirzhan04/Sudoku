"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, MapPin, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { formatSeconds, initials } from "@/lib/utils";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  city?: string | null;
  bestTimeSeconds?: number | null;
  averageAccuracy: number;
  completedGames: number;
  tier: string;
  pro: boolean;
};

export default function LeaderboardPage() {
  const [city, setCity] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<LeaderboardEntry[]>("/leaderboard/global?limit=100")
      .then((response) => setEntries(response.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => entries.filter((entry) => (entry.city ?? "").toLowerCase().includes(city.trim().toLowerCase())),
    [city, entries]
  );
  const topCity = city || "Almaty";

  return (
    <div className="relative overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
      <div className="page-shell relative space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="outline" className="mb-3 gap-2">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              Живой рейтинг
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight">Рейтинг</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Только настоящие данные backend: завершённые игры, лучшее время и средняя точность.
            </p>
          </div>
          <div className="relative w-full md:w-[320px]">
            <MapPin className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9" placeholder="Фильтр по городу" value={city} onChange={(event) => setCity(event.target.value)} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="bg-card/88 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle>Глобальный рейтинг</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? <div className="skeleton h-56" /> : null}
              {!loading && filtered.length === 0 ? (
                <div className="rounded-lg border bg-background/60 p-4 text-sm text-muted-foreground">Пока нет результатов.</div>
              ) : null}
              {filtered.length ? (
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-2 text-start">#</th>
                      <th className="py-2 text-start">Игрок</th>
                      <th className="py-2 text-start">Город</th>
                      <th className="py-2 text-start">Лучшее время</th>
                      <th className="py-2 text-start">Точность</th>
                      <th className="py-2 text-start">Завершено</th>
                      <th className="py-2 text-start">Лига</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => (
                      <tr key={entry.userId} className="border-b last:border-0">
                        <td className="py-3 font-mono">#{entry.rank}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={entry.avatarUrl ?? undefined} />
                              <AvatarFallback>{initials(entry.username)}</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2 font-medium">
                              {entry.username}
                              {entry.pro ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">{entry.city ?? "Global"}</td>
                        <td className="py-3 font-mono">{entry.bestTimeSeconds ? formatSeconds(entry.bestTimeSeconds) : "--:--"}</td>
                        <td className="py-3">{Math.round(Number(entry.averageAccuracy ?? 0))}%</td>
                        <td className="py-3">{entry.completedGames}</td>
                        <td className="py-3">{entry.tier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card/88 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle>Лучшие из {topCity}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entries
                .filter((entry) => (entry.city ?? "").toLowerCase().includes(topCity.toLowerCase()))
                .slice(0, 4)
                .map((entry, index) => (
                  <div key={entry.userId} className="flex items-center justify-between rounded-lg border bg-background/60 p-3">
                    <div className="flex items-center gap-3">
                      <Medal className={["h-5 w-5", index === 0 ? "text-amber-400" : "text-muted-foreground"].join(" ")} />
                      <div>
                        <div className="font-medium">{entry.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.bestTimeSeconds ? formatSeconds(entry.bestTimeSeconds) : "--:--"} / {Math.round(Number(entry.averageAccuracy ?? 0))}%
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{entry.tier}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
