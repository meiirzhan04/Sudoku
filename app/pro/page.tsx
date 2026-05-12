"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Brain, Crown, Flame, Palette, ShieldCheck, Sparkles, Swords, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiClient, hasAuthToken } from "@/lib/api-client";

const perks = [
  { icon: Brain, title: "AI Coach без лимитов", description: "Больше подсказок, объяснений клеток и стратегий без ощущения, что тебя остановили на самом интересном." },
  { icon: Palette, title: "Премиум темы", description: "Neon, Ocean, Minimal, Dark Glass и будущие сезонные скины для доски." },
  { icon: Flame, title: "Streak protection", description: "Заморозки стрика и больше контроля над ежедневным прогрессом." },
  { icon: Swords, title: "Battle extras", description: "Красивый Pro badge, приватные комнаты и будущие battle-настройки." },
  { icon: ShieldCheck, title: "Cloud priority", description: "Сохранения, статистика и профиль получают приоритет в будущих релизах." },
  { icon: Crown, title: "Pro status", description: "Профиль, рейтинг и друзья видят, что ты играешь на Pro уровне." }
];

type UserResponse = {
  role: "USER" | "PRO" | "ADMIN";
};

export default function ProPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  async function activatePro() {
    if (!hasAuthToken()) {
      router.push("/login?next=/pro");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<UserResponse>("/users/me/pro-preview");
      setActivated(response.data.role === "PRO" || response.data.role === "ADMIN");
      window.dispatchEvent(new Event("sudokumind-auth-updated"));
      toast({ title: "Pro включён. Добро пожаловать в preview.", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Не удалось включить Pro preview. Попробуй войти снова.", variant: "info" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div className="page-shell relative space-y-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
          <div className="space-y-5">
            <Badge variant="outline" className="gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Pro preview
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">SudokuMind Pro</h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Сейчас можно включить Pro бесплатно. Когда проект выйдет в настоящий запуск, сюда подключим payment, тарифы и честную подписку.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" onClick={activatePro} disabled={loading || activated}>
                <Crown className="h-4 w-4" />
                {activated ? "Pro уже включён" : loading ? "Включаем..." : "Включить Pro бесплатно"}
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/battle")}>
                <Swords className="h-4 w-4" />
                В Battle
              </Button>
            </div>
          </div>

          <Card className="bg-card/90 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                Что получишь
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Mini label="Цена сейчас" value="0" />
              <Mini label="Статус" value={activated ? "Active" : "Preview"} />
              <Mini label="Payment" value="Later" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {perks.map((perk) => (
            <Card key={perk.title} className="bg-card/88 shadow-soft backdrop-blur">
              <CardContent className="space-y-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <perk.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">{perk.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{perk.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2 font-mono text-xl font-semibold">
        <Zap className="h-4 w-4 text-primary" />
        {value}
      </div>
    </div>
  );
}
