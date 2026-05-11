"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Crown, Gamepad2, Globe2, Home, LogOut, Moon, Settings, SunMedium, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";
import { Locale, locales } from "@/lib/i18n/messages";
import { initials } from "@/lib/utils";

type SessionUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  role: "USER" | "ADMIN" | "PRO";
};

const languageNames: Record<Locale, string> = {
  en: "EN English",
  ru: "RU Русский",
  kk: "KZ Қазақша"
};

const navCopy: Record<Locale, { battle: string; leaderboard: string; pricing: string; settings: string; profile: string; proBadge: string }> = {
  en: {
    battle: "Battle",
    leaderboard: "Leaderboard",
    pricing: "Pricing",
    settings: "Settings",
    profile: "Profile",
    proBadge: "Pro"
  },
  ru: {
    battle: "Битва",
    leaderboard: "Рейтинг",
    pricing: "Тарифы",
    settings: "Настройки",
    profile: "Профиль",
    proBadge: "Pro"
  },
  kk: {
    battle: "Жарыс",
    leaderboard: "Рейтинг",
    pricing: "Тарифтер",
    settings: "Баптаулар",
    profile: "Профиль",
    proBadge: "Pro"
  }
};

export function AppShell({ children }: { children: ReactNode }) {
  const { locale, setLocale, t } = useLanguage();
  const nav = navCopy[locale];
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadUser = useCallback(() => {
    const token = window.localStorage.getItem("sudokumind-access-token");
    if (!token) {
      setUser(null);
      setAuthChecked(true);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1800);

    fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": locale
      },
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          window.localStorage.removeItem("sudokumind-access-token");
          window.localStorage.removeItem("sudokumind-refresh-token");
          document.cookie = "sm_access_token=; path=/; max-age=0; SameSite=Lax";
          setUser(null);
          return;
        }

        setUser((await response.json()) as SessionUser);
      })
      .catch(() => setUser(null))
      .finally(() => {
        window.clearTimeout(timeout);
        setAuthChecked(true);
      });
  }, [locale]);

  useEffect(() => {
    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("sudokumind-auth-updated", loadUser);
    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("sudokumind-auth-updated", loadUser);
    };
  }, [loadUser]);

  const links = [
    { href: "/play", label: t("nav.play") },
    { href: "/daily", label: t("nav.daily") },
    { href: "/battle", label: nav.battle },
    { href: "/leaderboard", label: nav.leaderboard },
    ...(user ? [{ href: "/profile", label: nav.profile }, { href: "/settings", label: nav.settings }] : []),
    { href: "/pro", label: nav.pricing }
  ];

  function signOut() {
    window.localStorage.removeItem("sudokumind-access-token");
    window.localStorage.removeItem("sudokumind-refresh-token");
    window.localStorage.removeItem("sudokumind-remember");
    document.cookie = "sm_access_token=; path=/; max-age=0; SameSite=Lax";
    window.dispatchEvent(new Event("sudokumind-auth-updated"));
    setUser(null);
    router.push("/");
  }

  const mobileLinks = [
    { href: "/play", label: t("nav.play"), icon: Gamepad2 },
    { href: "/daily", label: t("nav.daily"), icon: Home },
    { href: user ? "/profile" : "/login", label: nav.profile, icon: UserRound }
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="h-0.5 overflow-hidden bg-primary/15">
          <div className="navbar-accent-line h-full w-1/3 bg-primary" />
        </div>
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:gap-3 sm:px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2 font-semibold">
            <Image src="/favicon.svg" alt="SudokuMind" width={36} height={36} className="rounded-md shadow-sm shadow-primary/25 transition-transform group-hover:-translate-y-0.5" priority />
            <span className="hidden tracking-tight min-[380px]:inline">SudokuMind</span>
          </Link>

          <nav className="ms-2 hidden min-w-0 items-center gap-1 rounded-md border bg-card/60 p-1 lg:flex">
            {links.map((link) => (
              <Button key={link.href} variant={pathname === link.href ? "secondary" : "ghost"} size="sm" asChild className="shrink-0">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>

          <div className="ms-auto flex min-w-0 items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <Globe2 className="hidden h-4 w-4 text-muted-foreground sm:block" />
              <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
                <SelectTrigger className="h-9 w-[104px] sm:w-[132px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((item) => (
                    <SelectItem key={item} value={item}>
                      {languageNames[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label={t("nav.theme")}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <SunMedium className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex lg:hidden xl:inline-flex">
              <Link href="/pro">
                <Crown className="h-4 w-4 text-primary" />
                {nav.pricing}
              </Link>
            </Button>

            {!authChecked ? null : user ? (
              <div className="relative flex items-center gap-2">
                <button type="button" className="relative" onClick={() => setProfileOpen((value) => !value)} aria-label={nav.profile}>
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback>{initials(user.fullName ?? user.email)}</AvatarFallback>
                  </Avatar>
                  {user.role === "PRO" ? (
                    <Badge className="absolute -bottom-2 -end-2 px-1 py-0 text-[10px]">{nav.proBadge}</Badge>
                  ) : null}
                </button>
                {profileOpen ? (
                  <div className="absolute end-0 top-11 z-50 w-48 overflow-hidden rounded-lg border bg-card p-1 text-sm shadow-soft">
                    <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted" onClick={() => setProfileOpen(false)}>
                      <UserRound className="h-4 w-4" />
                      {nav.profile}
                    </Link>
                    <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted" onClick={() => setProfileOpen(false)}>
                      <Settings className="h-4 w-4" />
                      {nav.settings}
                    </Link>
                    <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted" onClick={signOut}>
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/login">{t("nav.login")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    <UserRound className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("nav.register")}</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-background/95 px-2 py-1.5 backdrop-blur lg:hidden">
        {mobileLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "flex flex-col items-center justify-center gap-0.5 rounded-md py-1.5 text-xs font-medium",
              pathname === link.href ? "bg-primary/12 text-primary" : "text-muted-foreground"
            ].join(" ")}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>
      <AnimatePresence mode="wait">
        <motion.main
          className="pb-20 lg:pb-0"
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
