"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, MapPin, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/providers/language-provider";
import type { Locale } from "@/lib/i18n/messages";
import { formatSeconds, initials } from "@/lib/utils";

type LeaderboardEntry = {
  username: string;
  avatarUrl?: string;
  city: string;
  bestTime: number;
  accuracy: number;
  completedGames: number;
  rank: string;
  isPro?: boolean;
};

const entries: LeaderboardEntry[] = [
  { username: "Aruzhan", city: "Almaty", bestTime: 276, accuracy: 99, completedGames: 143, rank: "Grandmaster", isPro: true },
  { username: "Meirzhan", city: "Aktobe", bestTime: 301, accuracy: 98, completedGames: 87, rank: "Diamond" },
  { username: "Nfactorial", city: "Almaty", bestTime: 318, accuracy: 97, completedGames: 112, rank: "Diamond", isPro: true },
  { username: "Dias", city: "Astana", bestTime: 355, accuracy: 96, completedGames: 68, rank: "Gold" },
  { username: "Miras", city: "Aktobe", bestTime: 402, accuracy: 95, completedGames: 51, rank: "Silver" },
  { username: "GridMaster", city: "Shymkent", bestTime: 430, accuracy: 94, completedGames: 44, rank: "Silver" }
];

const copy: Record<Locale, {
  badge: string;
  title: string;
  subtitle: string;
  filter: string;
  global: string;
  rank: string;
  player: string;
  city: string;
  bestTime: string;
  accuracy: string;
  completed: string;
  tier: string;
  cityTop: (city: string) => string;
}> = {
  en: {
    badge: "Live rankings",
    title: "Leaderboard",
    subtitle: "Global and city rankings by best time, accuracy and completed games.",
    filter: "Filter by city",
    global: "Global leaderboard",
    rank: "Rank",
    player: "Player",
    city: "City",
    bestTime: "Best time",
    accuracy: "Accuracy",
    completed: "Completed",
    tier: "Tier",
    cityTop: (city) => `Top players from ${city}`
  },
  ru: {
    badge: "Живой рейтинг",
    title: "Рейтинг",
    subtitle: "Глобальный и городской рейтинг по лучшему времени, точности и завершённым играм.",
    filter: "Фильтр по городу",
    global: "Глобальный рейтинг",
    rank: "Место",
    player: "Игрок",
    city: "Город",
    bestTime: "Лучшее время",
    accuracy: "Точность",
    completed: "Завершено",
    tier: "Лига",
    cityTop: (city) => `Лучшие игроки из ${city}`
  },
  kk: {
    badge: "Тірі рейтинг",
    title: "Рейтинг",
    subtitle: "Үздік уақыт, дәлдік және аяқталған ойындар бойынша global және қала рейтингі.",
    filter: "Қала бойынша сүзу",
    global: "Global рейтинг",
    rank: "Орын",
    player: "Ойыншы",
    city: "Қала",
    bestTime: "Үздік уақыт",
    accuracy: "Дәлдік",
    completed: "Аяқталды",
    tier: "Лига",
    cityTop: (city) => `${city} қаласының үздік ойыншылары`
  }
};

export default function LeaderboardPage() {
  const { locale } = useLanguage();
  const c = copy[locale];
  const [city, setCity] = useState("");
  const filtered = useMemo(
    () => entries.filter((entry) => entry.city.toLowerCase().includes(city.trim().toLowerCase())),
    [city]
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
              {c.badge}
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight">{c.title}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {c.subtitle}
            </p>
          </div>
          <div className="relative w-full md:w-[320px]">
            <MapPin className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9" placeholder={c.filter} value={city} onChange={(event) => setCity(event.target.value)} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="bg-card/88 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle>{c.global}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 text-start">{c.rank}</th>
                    <th className="py-2 text-start">{c.player}</th>
                    <th className="py-2 text-start">{c.city}</th>
                    <th className="py-2 text-start">{c.bestTime}</th>
                    <th className="py-2 text-start">{c.accuracy}</th>
                    <th className="py-2 text-start">{c.completed}</th>
                    <th className="py-2 text-start">{c.tier}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, index) => (
                    <tr key={entry.username} className="border-b last:border-0">
                      <td className="py-3 font-mono">#{index + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={entry.avatarUrl} />
                            <AvatarFallback>{initials(entry.username)}</AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2 font-medium">
                            {entry.username}
                            {entry.isPro ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{entry.city}</td>
                      <td className="py-3 font-mono">{formatSeconds(entry.bestTime)}</td>
                      <td className="py-3">{entry.accuracy}%</td>
                      <td className="py-3">{entry.completedGames}</td>
                      <td className="py-3">{entry.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="bg-card/88 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle>{c.cityTop(topCity)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entries
                .filter((entry) => entry.city.toLowerCase().includes(topCity.toLowerCase()))
                .slice(0, 4)
                .map((entry, index) => (
                  <div key={entry.username} className="flex items-center justify-between rounded-lg border bg-background/60 p-3">
                    <div className="flex items-center gap-3">
                      <Medal className={["h-5 w-5", index === 0 ? "text-amber-400" : "text-muted-foreground"].join(" ")} />
                      <div>
                        <div className="font-medium">{entry.username}</div>
                        <div className="text-xs text-muted-foreground">{formatSeconds(entry.bestTime)} / {entry.accuracy}%</div>
                      </div>
                    </div>
                    <Badge variant="outline">{entry.rank}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
