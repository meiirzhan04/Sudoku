"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
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
import { createClient } from "@/lib/supabase/client";
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

export function ProfileClient() {
  const { t, locale, setLocale } = useLanguage();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileState>({
    full_name: "",
    username: "",
    city: "",
    avatar_url: "",
    language: locale,
    theme: "system"
  });
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const [{ data: profileData }, { data: gameData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", data.user.id).single(),
        supabase
          .from("games")
          .select("id, created_at, difficulty, elapsed_seconds, mistakes, accuracy")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(20)
      ]);
      if (profileData) {
        setProfile({
          full_name: profileData.full_name ?? "",
          username: profileData.username ?? "",
          city: profileData.city ?? "",
          avatar_url: profileData.avatar_url ?? "",
          language: profileData.language ?? locale,
          theme: profileData.theme ?? "system"
        });
      }
      setGames((gameData as GameHistory[]) ?? []);
      setLoading(false);
    });
  }, [locale]);

  const stats = useMemo(() => {
    const completed = games.filter((game) => game.elapsed_seconds > 0);
    const avg = completed.length
      ? Math.round(completed.reduce((sum, game) => sum + game.elapsed_seconds, 0) / completed.length)
      : 0;
    const accuracy = completed.length
      ? Math.round(completed.reduce((sum, game) => sum + Number(game.accuracy ?? 100), 0) / completed.length)
      : 100;
    return { games: games.length, avg, accuracy, streak: Math.min(games.length, 12) };
  }, [games]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    const {
      data: { user }
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (!supabase || !user) return;

    const form = new FormData(event.currentTarget);
    const file = form.get("avatar") as File | null;
    let avatarUrl = profile.avatar_url;

    if (file?.size) {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/avatar.${ext}`;
      const upload = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (!upload.error) {
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
    }

    const nextProfile = { ...profile, avatar_url: avatarUrl };
    const { error } = await supabase.from("profiles").update(nextProfile).eq("id", user.id);
    if (error) toast({ title: error.message, variant: "error" });
    else {
      setLocale(nextProfile.language);
      setTheme(nextProfile.theme);
      setProfile(nextProfile);
      toast({ title: t("common.success"), variant: "success" });
    }
  }

  async function deleteAccount() {
    const supabase = createClient();
    await fetch("/api/account/delete", { method: "DELETE" });
    await supabase?.auth.signOut();
    window.location.href = "/";
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
