"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, BadgeCheck, Crown, LockKeyhole, Save, Search, Shield, SlidersHorizontal, Trophy, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiClient, hasAuthToken } from "@/lib/api-client";
import { formatSeconds } from "@/lib/utils";

type Role = "USER" | "ADMIN" | "PRO";
type AccessState = "checking" | "login" | "forbidden" | "allowed";
type LoadIssue = {
  title: string;
  description: string;
  action: string;
};

type SessionUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: Role;
};

type AdminUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  city?: string | null;
  role: Role;
  emailVerified: boolean;
  gamesPlayed: number;
  wins: number;
  bestTimeSeconds?: number | null;
  averageAccuracy: number;
  currentStreak: number;
  xp: number;
  xpOverride?: number | null;
  streakOverride?: number | null;
  updatedAt: string;
};

type PublicUser = {
  id: string;
  fullName?: string | null;
  username: string;
  city?: string | null;
  role?: Role;
  stats?: {
    gamesPlayed?: number;
    wins?: number;
    bestTimeSeconds?: number | null;
    averageAccuracy?: number | null;
    bestStreak?: number;
  };
};

type Draft = {
  fullName: string;
  username: string;
  city: string;
  role: Role;
  emailVerified: boolean;
  xpOverride: string;
  streakOverride: string;
};

export default function AdminPage() {
  const { toast } = useToast();
  const [access, setAccess] = useState<AccessState>("checking");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadIssue, setLoadIssue] = useState<LoadIssue | null>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAdmin() {
      if (!hasAuthToken()) {
        setAccess("login");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const me = await apiClient.get<SessionUser>("/users/me", { signal: controller.signal });
        setCurrentUser(me.data);

        if (me.data.role !== "ADMIN") {
          setAccess("forbidden");
          setUsers([]);
          setSelectedId(undefined);
          setDraft(null);
          return;
        }

        setAccess("allowed");
        setLoadIssue(null);
        try {
          const response = await apiClient.get<AdminUser[]>(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`, { signal: controller.signal });
          setReadOnlyMode(response.headers["x-sudokumind-admin-source"] === "public-search");
          setUsers(response.data);

          const stillSelected = response.data.find((user) => user.id === selectedId);
          const nextSelected = stillSelected ?? response.data[0];
          if (nextSelected) selectUser(nextSelected);
        } catch (error: any) {
          if (controller.signal.aborted) return;
          if (error?.response?.status === 403) {
            setAccess("forbidden");
            return;
          }
          const fallback = await loadPublicUsersFallback(query, controller.signal);
          if (controller.signal.aborted) return;
          if (fallback) {
            setReadOnlyMode(true);
            setLoadIssue(null);
            setUsers(fallback);
            const stillSelected = fallback.find((user) => user.id === selectedId);
            const nextSelected = stillSelected ?? fallback[0];
            if (nextSelected) selectUser(nextSelected);
            return;
          }

          setUsers([]);
          setSelectedId(undefined);
          setDraft(null);
          setReadOnlyMode(false);
          setLoadIssue(readAdminIssue(error));
        }
      } catch (error: any) {
        if (controller.signal.aborted) return;
        setAccess(error?.response?.status === 403 ? "forbidden" : "login");
        toast({ title: error?.response?.status === 401 ? "Admin sign in required" : "Could not verify admin session", variant: "error" });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadAdmin();
    return () => controller.abort();
    // The selected user is preserved while searching when possible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, toast]);

  const selected = useMemo(() => users.find((user) => user.id === selectedId), [selectedId, users]);
  const summary = useMemo(() => {
    const wins = users.reduce((total, user) => total + user.wins, 0);
    const accuracy = users.length ? Math.round(users.reduce((total, user) => total + Number(user.averageAccuracy ?? 0), 0) / users.length) : 0;
    return {
      users: users.length,
      admins: users.filter((user) => user.role === "ADMIN").length,
      pro: users.filter((user) => user.role === "PRO").length,
      wins,
      accuracy
    };
  }, [users]);

  function selectUser(user: AdminUser) {
    setSelectedId(user.id);
    setDraft({
      fullName: user.fullName,
      username: user.username,
      city: user.city ?? "",
      role: user.role,
      emailVerified: user.emailVerified,
      xpOverride: user.xpOverride == null ? "" : String(user.xpOverride),
      streakOverride: user.streakOverride == null ? "" : String(user.streakOverride)
    });
  }

  async function saveUser() {
    if (!selected || !draft) return;
    if (readOnlyMode) {
      toast({ title: "Full player controls will unlock after the backend admin API redeploys.", variant: "info" });
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.put<AdminUser>(`/admin/users/${selected.id}`, {
        fullName: draft.fullName,
        username: draft.username,
        city: draft.city,
        role: draft.role,
        emailVerified: draft.emailVerified,
        xpOverride: draft.xpOverride === "" ? null : Number(draft.xpOverride),
        streakOverride: draft.streakOverride === "" ? null : Number(draft.streakOverride)
      });
      setUsers((current) => current.map((user) => (user.id === response.data.id ? response.data : user)));
      selectUser(response.data);
      toast({ title: "Player settings saved", variant: "success" });
    } catch {
      toast({ title: "Could not save player", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (access === "checking") {
    return <AccessCard icon={LockKeyhole} title="Checking admin access" description="Verifying your administrator session before loading the console." />;
  }

  if (access === "login") {
    return (
      <AccessCard
        icon={LockKeyhole}
        title="Admin sign in required"
        description="Use an administrator account to open this console. Player accounts cannot access admin tools."
        action={<Button asChild><Link href="/login?next=/admin">Sign in as admin</Link></Button>}
      />
    );
  }

  if (access === "forbidden") {
    return (
      <AccessCard
        icon={AlertTriangle}
        title="Access denied"
        description={`${currentUser?.username ?? "This account"} is not an administrator. Admin data was not loaded.`}
        action={<Button variant="outline" asChild><Link href="/">Back to SudokuMind</Link></Button>}
      />
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
      <div className="page-shell relative space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge variant="outline" className="mb-3 gap-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Secure operator console
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight">Admin Console</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Manage users, roles, email status, XP overrides, and streak overrides. This view is loaded only after an ADMIN role check.
            </p>
          </div>
          <div className="relative w-full lg:w-[360px]">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9" placeholder="Search username, email, name" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard icon={Users} label="Total users" value={summary.users} />
          <SummaryCard icon={Shield} label="Admins" value={summary.admins} />
          <SummaryCard icon={Crown} label="Pro users" value={summary.pro} />
          <SummaryCard icon={Trophy} label="Total wins" value={summary.wins} />
          <SummaryCard icon={BadgeCheck} label="Avg accuracy" value={`${summary.accuracy}%`} />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <Card className="bg-card/90 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadIssue ? (
                <div className="rounded-lg border bg-background/60 p-4 text-sm">
                  <div className="font-medium">{loadIssue.title}</div>
                  <p className="mt-1 leading-6 text-muted-foreground">{loadIssue.description}</p>
                  <p className="mt-3 text-xs text-primary">{loadIssue.action}</p>
                </div>
              ) : null}
              {readOnlyMode ? (
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
                  <div className="font-medium">Compatibility mode</div>
                  <p className="mt-1 leading-6 text-muted-foreground">
                    Users are visible now. Editing XP, streak, roles and email status will unlock automatically when the backend admin API is live.
                  </p>
                </div>
              ) : null}
              {loading ? <div className="skeleton h-40" /> : null}
              {!loading && users.length === 0 && !loadIssue ? (
                <div className="rounded-lg border bg-background/60 p-4 text-sm text-muted-foreground">No users found.</div>
              ) : null}
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectUser(user)}
                  className={[
                    "grid w-full gap-3 rounded-lg border bg-background/60 p-3 text-left transition hover:border-primary/50 md:grid-cols-[minmax(0,1fr)_320px]",
                    selectedId === user.id ? "border-primary bg-primary/10" : ""
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate font-medium">
                      <span className="truncate">{user.username}</span>
                      {user.emailVerified ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span>{user.role}</span>
                    <span>{user.xp} XP</span>
                    <span>{user.currentStreak} streak</span>
                    <span>{user.wins} wins</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/90 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                Player controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selected || !draft ? (
                <div className="rounded-lg border bg-background/60 p-4 text-sm text-muted-foreground">Select a user to edit.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Mini label="Games" value={selected.gamesPlayed} />
                    <Mini label="Wins" value={selected.wins} />
                    <Mini label="Best time" value={selected.bestTimeSeconds ? formatSeconds(selected.bestTimeSeconds) : "--:--"} />
                    <Mini label="Accuracy" value={`${selected.averageAccuracy}%`} />
                  </div>
                  <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
                    Last backend update: <span className="font-mono text-foreground">{new Date(selected.updatedAt).toLocaleString()}</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Full name</Label>
                      <Input value={draft.fullName} disabled={readOnlyMode} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={draft.username} disabled={readOnlyMode} onChange={(event) => setDraft({ ...draft, username: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={draft.city} disabled={readOnlyMode} onChange={(event) => setDraft({ ...draft, city: event.target.value })} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={draft.role} disabled={readOnlyMode} onValueChange={(value) => setDraft({ ...draft, role: value as Role })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="PRO">PRO</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <label className="mt-8 flex items-center gap-2 rounded-lg border bg-background/60 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.emailVerified}
                        disabled={readOnlyMode}
                        onChange={(event) => setDraft({ ...draft, emailVerified: event.target.checked })}
                      />
                      Email verified
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>XP override</Label>
                      <Input type="number" value={draft.xpOverride} disabled={readOnlyMode} placeholder={`${selected.xp}`} onChange={(event) => setDraft({ ...draft, xpOverride: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Streak override</Label>
                      <Input type="number" value={draft.streakOverride} disabled={readOnlyMode} placeholder={`${selected.currentStreak}`} onChange={(event) => setDraft({ ...draft, streakOverride: event.target.value })} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={saveUser} disabled={saving || readOnlyMode}>
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save player"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AccessCard({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-lg border-primary/20 bg-card/95 shadow-soft">
        <CardContent className="space-y-5 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          {action}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 font-mono text-2xl font-semibold">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}

async function loadPublicUsersFallback(query: string, signal: AbortSignal) {
  try {
    const response = await apiClient.get<PublicUser[]>(`/users/search?username=${encodeURIComponent(query)}`, { signal });
    return response.data.map(toAdminUser);
  } catch {
    return null;
  }
}

function toAdminUser(user: PublicUser): AdminUser {
  return {
    id: user.id,
    fullName: user.fullName ?? user.username,
    username: user.username,
    email: "Read-only until admin API is live",
    city: user.city ?? null,
    role: user.role ?? "USER",
    emailVerified: false,
    gamesPlayed: user.stats?.gamesPlayed ?? 0,
    wins: user.stats?.wins ?? 0,
    bestTimeSeconds: user.stats?.bestTimeSeconds ?? null,
    averageAccuracy: Number(user.stats?.averageAccuracy ?? 0),
    currentStreak: user.stats?.bestStreak ?? 0,
    xp: (user.stats?.wins ?? 0) * 50,
    xpOverride: null,
    streakOverride: null,
    updatedAt: new Date().toISOString()
  };
}

function readAdminIssue(error: any): LoadIssue {
  const status = error?.response?.status;
  const message = error?.response?.data?.message ?? error?.response?.data?.error;
  if (status === 404) {
    return {
      title: "Backend deployment is not updated yet",
      description: "The app is open as ADMIN, but the production backend does not expose /api/admin/users yet. Deploy the latest backend build or set NEXT_PUBLIC_API_URL to the backend that has the admin endpoints.",
      action: "After the backend redeploy finishes, refresh this page."
    };
  }
  if (status === 401) {
    return {
      title: "Admin session expired",
      description: "Your browser session is no longer accepted by the backend.",
      action: "Sign out, then sign in again with the admin account."
    };
  }
  if (status === 403) {
    return {
      title: "Admin access was rejected",
      description: "The backend answered, but this token is not accepted for admin data.",
      action: "Sign in again with admin@gmail.com or check the user role in the database."
    };
  }
  if (status && status >= 500) {
    return {
      title: "Backend is starting or unavailable",
      description: message ? String(message) : "The admin API answered with a server error while loading users.",
      action: "Refresh in a moment. If it stays here, check backend logs."
    };
  }
  return {
    title: "Admin data is waiting for backend",
    description: message ? String(message) : "The app could not reach the backend admin API from this deployment.",
    action: "Check NEXT_PUBLIC_API_URL / BACKEND_URL and refresh."
  };
}
