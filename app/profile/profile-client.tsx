"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/components/ui/toast";
import { languageNames, Locale, locales } from "@/lib/i18n/messages";
import { formatSeconds, initials } from "@/lib/utils";

type ProfileState = {
  full_name: string;
  username: string;
  city: string;
  avatar_url: string;
  language: Locale;
  theme: "light" | "dark" | "system";
};

type GameHistory = {
  id: string;
  created_at: string;
  difficulty: string;
  elapsed_seconds: number;
  mistakes: number;
  accuracy: number;
};

type BackendUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  city?: string | null;
  avatarUrl?: string | null;
  language: Locale;
  stats?: {
    gamesPlayed: number;
    wins: number;
    bestTimeSeconds?: number | null;
    averageAccuracy?: number | string | null;
    bestStreak: number;
    friendsCount: number;
  };
};

function backendUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}

export function ProfileClient() {
  const { t, locale, setLocale } = useLanguage();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileState>({
    full_name: "",
    username: "",
    city: "",
    avatar_url: "",
    language: locale,
    theme: "system"
  });
  const [games, setGames] = useState<GameHistory[]>([]);
  const [backendStats, setBackendStats] = useState<BackendUser["stats"]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem("sudokumind-access-token");
    if (!token) {
      setLoading(false);
      router.replace("/login?next=/profile");
      return;
    }

    fetch(`${backendUrl()}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": locale
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          window.localStorage.removeItem("sudokumind-access-token");
          window.localStorage.removeItem("sudokumind-refresh-token");
          document.cookie = "sm_access_token=; path=/; max-age=0; SameSite=Lax";
          router.replace("/login?next=/profile");
          return;
        }

        const user = (await response.json()) as BackendUser;
        setProfile({
          full_name: user.fullName ?? "",
          username: user.username ?? "",
          city: user.city ?? "",
          avatar_url: user.avatarUrl ?? "",
          language: user.language ?? locale,
          theme: "system"
        });
        setBackendStats(user.stats);
        setGames([]);
      })
      .catch(() => {
        toast({ title: "Failed to load profile", variant: "error" });
      })
      .finally(() => setLoading(false));
  }, [locale, router, toast]);

  const stats = useMemo(() => {
    if (backendStats) {
      const averageAccuracy = Number(backendStats.averageAccuracy ?? 0);
      return {
        games: backendStats.gamesPlayed,
        avg: backendStats.bestTimeSeconds ?? 0,
        accuracy: Math.round(averageAccuracy || 100),
        streak: backendStats.bestStreak
      };
    }

    const completed = games.filter((game) => game.elapsed_seconds > 0);
    const avg = completed.length
      ? Math.round(completed.reduce((sum, game) => sum + game.elapsed_seconds, 0) / completed.length)
      : 0;
    const accuracy = completed.length
      ? Math.round(completed.reduce((sum, game) => sum + Number(game.accuracy ?? 100), 0) / completed.length)
      : 100;
    return { games: games.length, avg, accuracy, streak: Math.min(games.length, 12) };
  }, [backendStats, games]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem("sudokumind-access-token");
    if (!token) {
      router.replace("/login?next=/profile");
      return;
    }

    const response = await fetch(`${backendUrl()}/api/users/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept-Language": locale
      },
      body: JSON.stringify({
        fullName: profile.full_name,
        username: profile.username,
        city: profile.city,
        avatarUrl: profile.avatar_url,
        language: profile.language
      })
    });

    if (!response.ok) {
      toast({ title: await readApiError(response), variant: "error" });
      return;
    }

    const user = (await response.json()) as BackendUser;
    const nextProfile = {
      ...profile,
      full_name: user.fullName ?? "",
      username: user.username ?? "",
      city: user.city ?? "",
      avatar_url: user.avatarUrl ?? "",
      language: user.language ?? profile.language
    };
    setBackendStats(user.stats);
    setLocale(nextProfile.language);
    setTheme(nextProfile.theme);
    setProfile(nextProfile);
    toast({ title: t("common.success"), variant: "success" });
  }

  async function deleteAccount() {
    const token = window.localStorage.getItem("sudokumind-access-token");
    if (token) {
      await fetch(`${backendUrl()}/api/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": locale
        }
      });
    }

    window.localStorage.removeItem("sudokumind-access-token");
    window.localStorage.removeItem("sudokumind-refresh-token");
    window.localStorage.removeItem("sudokumind-remember");
    document.cookie = "sm_access_token=; path=/; max-age=0; SameSite=Lax";
    window.location.href = "/";
  }

  async function readApiError(response: Response) {
    try {
      const data = (await response.json()) as { message?: string; error?: string };
      return data.message ?? data.error ?? "Request failed";
    } catch {
      return "Request failed";
    }
  }

  if (loading) {
    return (
      <div className="page-shell space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-28" />
          ))}
        </div>
        <div className="skeleton h-80" />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback>{initials(profile.full_name || profile.username)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">{t("profile.title")}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username || "sudokumind"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("profile.games")} value={stats.games} />
        <Stat label={t("profile.avg")} value={formatSeconds(stats.avg)} />
        <Stat label={t("profile.accuracy")} value={`${stats.accuracy}%`} />
        <Stat label={t("profile.streak")} value={stats.streak} />
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">{t("nav.settings")}</TabsTrigger>
          <TabsTrigger value="history">{t("profile.history")}</TabsTrigger>
        </TabsList>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
                <Field label={t("common.fullName")} value={profile.full_name} onChange={(value) => setProfile({ ...profile, full_name: value })} />
                <Field label={t("common.username")} value={profile.username} onChange={(value) => setProfile({ ...profile, username: value })} />
                <Field label={t("common.city")} value={profile.city} onChange={(value) => setProfile({ ...profile, city: value })} />
                <div className="space-y-2">
                  <Label>{t("common.avatar")}</Label>
                  <Input name="avatar" type="file" accept="image/*" />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.language")}</Label>
                  <Select value={profile.language} onValueChange={(value) => setProfile({ ...profile, language: value as Locale })}>
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>{t("nav.theme")}</Label>
                  <Select value={profile.theme} onValueChange={(value) => setProfile({ ...profile, theme: value as ProfileState["theme"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t("common.light")}</SelectItem>
                      <SelectItem value="dark">{t("common.dark")}</SelectItem>
                      <SelectItem value="system">{t("common.system")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <Button>{t("common.save")}</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                        {t("common.delete")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("profile.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("profile.deleteBody")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAccount}>{t("profile.confirmDelete")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.history")}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 text-start">{t("common.date")}</th>
                    <th className="py-2 text-start">{t("common.difficulty")}</th>
                    <th className="py-2 text-start">{t("common.time")}</th>
                    <th className="py-2 text-start">{t("common.mistakes")}</th>
                    <th className="py-2 text-start">{t("profile.accuracy")}</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id} className="border-b last:border-0">
                      <td className="py-3">{new Date(game.created_at).toLocaleDateString()}</td>
                      <td className="py-3 capitalize">{game.difficulty}</td>
                      <td className="py-3 font-mono">{formatSeconds(game.elapsed_seconds)}</td>
                      <td className="py-3">{game.mistakes}</td>
                      <td className="py-3">{Math.round(game.accuracy)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
