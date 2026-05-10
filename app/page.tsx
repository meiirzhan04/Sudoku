"use client";

import Link from "next/link";
import { ArrowRight, Brain, CalendarDays, Clock3, ShieldCheck, Sparkles, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/providers/language-provider";

export default function HomePage() {
  const { t } = useLanguage();
  const features = [
    { icon: CalendarDays, title: t("landing.seeded"), meta: "Daily seed" },
    { icon: Sparkles, title: t("landing.coach"), meta: "AI coach" },
    { icon: Trophy, title: t("landing.stats"), meta: "Progress" }
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div className="page-shell relative">
        <section className="grid min-h-[calc(100vh-7rem)] items-center gap-8 py-4 lg:grid-cols-[1fr_0.92fr] lg:gap-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <Brain className="h-4 w-4 text-primary" />
            {t("landing.features")}
          </div>
          <div className="space-y-4">
            <h1 className="text-balance max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {t("landing.tagline")}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t("landing.sub")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/play">
                {t("landing.ctaPlay")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/daily">{t("landing.ctaDaily")}</Link>
            </Button>
          </div>
          <div className="grid max-w-xl grid-cols-1 gap-3 pt-2 min-[420px]:grid-cols-3">
            <Metric icon={Clock3} label="avg solve" value="08:42" />
            <Metric icon={ShieldCheck} label="accuracy" value="96%" />
            <Metric icon={Zap} label="streak" value="12" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-[2rem] border bg-card/30 shadow-soft backdrop-blur" />
          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <div className="text-sm font-medium">Expert preview</div>
                <div className="text-xs text-muted-foreground">AI-assisted solving</div>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Live</div>
            </div>
            <div className="grid aspect-square grid-cols-9 p-3">
            {Array.from({ length: 81 }).map((_, index) => {
              const row = Math.floor(index / 9);
              const col = index % 9;
              const value = [5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5][index % 15];
              return (
                <div
                  key={index}
                  className={[
                    "flex items-center justify-center border bg-background/70 text-lg font-semibold sm:text-2xl",
                    value ? "text-foreground" : "",
                    index === 40 ? "bg-primary text-primary-foreground shadow-inner" : "",
                    value === 5 ? "bg-primary/10 text-primary" : ""
                  ].join(" ")}
                  style={{
                    borderRightWidth: col === 2 || col === 5 ? 2 : 1,
                    borderBottomWidth: row === 2 || row === 5 ? 2 : 1
                  }}
                >
                  {value ? value : ""}
                </div>
              );
            })}
            </div>
            <div className="grid grid-cols-3 border-t bg-muted/35">
              <PreviewStat label="Hints" value="4 left" />
              <PreviewStat label="Timer" value="06:18" />
              <PreviewStat label="Mistakes" value="0" />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-3">
        {features.map((feature) => (
          <motion.div key={feature.title} whileHover={{ y: -4 }}>
            <Card className="h-full overflow-hidden">
              <CardContent className="space-y-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{feature.meta}</div>
                  <div className="mt-1 text-sm font-medium leading-6">{feature.title}</div>
                </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </section>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/70 p-3 shadow-sm backdrop-blur">
      <Icon className="mb-3 h-4 w-4 text-primary" />
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-e px-4 py-3 last:border-e-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}
