"use client";

import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, Mail, ShieldCheck, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/components/ui/toast";
import type { Locale } from "@/lib/i18n/messages";

type Mode = "login" | "register";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

const authCopy: Record<Locale, { creating: string; entering: string; hidePassword: string; showPassword: string; weak: string; medium: string; strong: string; failed: string }> = {
  en: {
    creating: "Creating account...",
    entering: "Signing in...",
    hidePassword: "Hide password",
    showPassword: "Show password",
    weak: "Weak password",
    medium: "Medium password",
    strong: "Strong password",
    failed: "Request failed. Check that backend is running."
  },
  ru: {
    creating: "Создаём аккаунт...",
    entering: "Входим...",
    hidePassword: "Скрыть пароль",
    showPassword: "Показать пароль",
    weak: "Слабый пароль",
    medium: "Средний пароль",
    strong: "Сильный пароль",
    failed: "Запрос не прошёл. Проверь, что backend работает."
  },
  kk: {
    creating: "Аккаунт жасалып жатыр...",
    entering: "Кіріп жатырмыз...",
    hidePassword: "Құпиясөзді жасыру",
    showPassword: "Құпиясөзді көрсету",
    weak: "Әлсіз құпиясөз",
    medium: "Орташа құпиясөз",
    strong: "Күшті құпиясөз",
    failed: "Сұрау орындалмады. Backend жұмыс істеп тұрғанын тексер."
  }
};

function validPassword(password: string) {
  return password.length >= 8 && /[\p{L}]/u.test(password) && /\d/.test(password);
}

function backendUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}

export function AuthCard({ mode }: { mode: Mode }) {
  const { t, locale } = useLanguage();
  const c = authCopy[locale];
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegister = mode === "register";
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [values, setValues] = useState({
    fullName: "",
    username: "",
    city: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "free" | "taken">("idle");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
  const passwordScore = useMemo(() => passwordStrength(values.password, c), [values.password, c]);
  const passwordsMatch = values.confirmPassword.length > 0 && values.password === values.confirmPassword;
  const formValid = isRegister
    ? values.fullName.trim().length > 1 &&
      values.username.trim().length >= 3 &&
      usernameStatus !== "taken" &&
      emailValid &&
      passwordScore.score >= 2 &&
      passwordsMatch
    : emailValid && values.password.length > 0;

  useEffect(() => {
    if (!isRegister || values.username.trim().length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const timer = window.setTimeout(() => {
      fetch(`/api/users/search?username=${encodeURIComponent(values.username.trim())}`)
        .then((response) => (response.ok ? response.json() : []))
        .then((items: Array<{ username?: string }>) => {
          const taken = items.some((item) => item.username?.toLowerCase() === values.username.trim().toLowerCase());
          setUsernameStatus(taken ? "taken" : "free");
        })
        .catch(() => setUsernameStatus("free"));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [isRegister, values.username]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (!validPassword(password)) {
      setError(t("auth.weakPassword"));
      setPending(false);
      return;
    }

    try {
      if (mode === "register") {
        await register(form, email, password);
        await login(form, email, password);
        setSuccess(true);
        toast({ title: t("common.success"), variant: "success" });
        window.setTimeout(() => router.push("/dashboard"), 280);
        router.refresh();
      } else {
        await login(form, email, password);
        setSuccess(true);
        toast({ title: t("auth.signIn"), variant: "success" });
        window.setTimeout(() => router.push(searchParams.get("next") ?? "/dashboard"), 220);
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : c.failed);
    } finally {
      setPending(false);
    }
  }

  async function register(form: FormData, email: string, password: string) {
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      throw new Error(t("auth.mismatch"));
    }

    const response = await fetch(`/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale
      },
      body: JSON.stringify({
        fullName: String(form.get("fullName") ?? ""),
        username: String(form.get("username") ?? ""),
        email,
        password,
        confirmPassword,
        city: String(form.get("city") ?? ""),
        language: locale
      })
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
  }

  async function login(form: FormData, email: string, password: string) {
    const rememberMe = Boolean(form.get("remember"));
    const response = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale
      },
      body: JSON.stringify({ email, password, rememberMe })
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = (await response.json()) as LoginResponse;
    window.localStorage.setItem("sudokumind-access-token", data.accessToken);
    window.localStorage.setItem("sudokumind-refresh-token", data.refreshToken);
    window.localStorage.setItem("sudokumind-remember", rememberMe ? "30" : "session");
    window.dispatchEvent(new Event("sudokumind-auth-updated"));
    document.cookie = `sm_access_token=${data.accessToken}; path=/; max-age=${
      rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
    }; SameSite=Lax`;
  }

  function google() {
    window.location.href = `${backendUrl()}/oauth2/authorization/google`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md"
    >
      <Card className="mx-auto overflow-hidden border-border/70 bg-card/95 shadow-soft">
        <CardHeader className="space-y-4 border-b bg-muted/25">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-2xl tracking-tight">
              {isRegister ? t("auth.signUp") : t("auth.signIn")}
            </CardTitle>
            <CardDescription className="mt-2 leading-6">{t("auth.passwordRule")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <motion.form
            onSubmit={onSubmit}
            animate={error ? { x: [0, -6, 6, -4, 4, 0] } : success ? { opacity: 0, y: -8, scale: 0.98 } : {}}
            className="space-y-4"
          >
            {isRegister ? (
              <>
                <Field name="fullName" label={t("common.fullName")} autoComplete="name" value={values.fullName} onChange={(value) => setValues({ ...values, fullName: value })} />
                <Field
                  name="username"
                  label={t("common.username")}
                  autoComplete="username"
                  value={values.username}
                  onChange={(value) => setValues({ ...values, username: value })}
                  status={usernameStatus}
                />
                <Field name="city" label={t("common.city")} autoComplete="address-level2" value={values.city} onChange={(value) => setValues({ ...values, city: value })} />
                <div className="space-y-2">
                  <Label htmlFor="avatar">
                    {t("common.avatar")} ({t("common.optional")})
                  </Label>
                  <Input id="avatar" name="avatar" type="file" accept="image/*" className="bg-background/70" />
                </div>
              </>
            ) : null}

            <Field
              name="email"
              label={t("common.email")}
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(value) => setValues({ ...values, email: value })}
              status={values.email ? (emailValid ? "free" : "taken") : "idle"}
            />
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                  className="bg-background/70 pe-10"
                  value={values.password}
                  onChange={(event) => setValues({ ...values, password: event.target.value })}
                />
                <button
                  type="button"
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? c.hidePassword : c.showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={[
                      "h-full rounded-full transition-all",
                      passwordScore.score <= 1 ? "bg-destructive" : passwordScore.score === 2 ? "bg-amber-400" : "bg-primary"
                    ].join(" ")}
                    style={{ width: `${passwordScore.score * 25}%` }}
                  />
                </div>
                {values.password ? <p className="text-xs text-muted-foreground">{passwordScore.label}</p> : null}
              </div>
            </div>

            {isRegister ? (
              <Field
                name="confirmPassword"
                label={t("common.confirmPassword")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(value) => setValues({ ...values, confirmPassword: value })}
                status={values.confirmPassword ? (passwordsMatch ? "free" : "taken") : "idle"}
              />
            ) : (
              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input name="remember" type="checkbox" className="h-4 w-4 rounded border-input" />
                  <span>{t("auth.remember")}</span>
                </label>
                <Link href="/forgot-password" className="text-primary hover:underline">
                  {t("auth.forgot")}
                </Link>
              </div>
            )}

            {error ? (
              <motion.p
                animate={{ x: [0, -5, 5, -3, 3, 0] }}
                className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </motion.p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending || !formValid}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <CheckCircle2 className="h-4 w-4" /> : null}
              {pending ? (isRegister ? c.creating : c.entering) : isRegister ? t("auth.signUp") : t("auth.signIn")}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={google}>
              <Mail className="h-4 w-4" />
              {isRegister ? t("auth.googleUp") : t("auth.googleIn")}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isRegister ? t("auth.haveAccount") : t("auth.needAccount")}{" "}
              <Link href={isRegister ? "/login" : "/register"} className="font-medium text-primary hover:underline">
                {isRegister ? t("auth.signIn") : t("auth.signUp")}
              </Link>
            </p>
          </motion.form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

async function readApiError(response: Response) {
  const fallback = "Request failed. Check that backend is running.";

  try {
    const data = (await response.json()) as { message?: string; error?: string };
    return data.message ?? data.error ?? fallback;
  } catch {
    return fallback;
  }
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  value,
  onChange,
  status = "idle"
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (value: string) => void;
  status?: "idle" | "checking" | "free" | "taken";
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required
          className="bg-background/70 pe-10"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
        {status === "checking" ? <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
        {status === "free" ? <CheckCircle2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /> : null}
        {status === "taken" ? <XCircle className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" /> : null}
      </div>
    </div>
  );
}

function passwordStrength(password: string, c: typeof authCopy.en) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-ZА-ЯӘҒҚҢӨҰҮҺІ]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-zА-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі0-9]/.test(password)) score += 1;
  const label = score <= 1 ? c.weak : score === 2 ? c.medium : c.strong;
  return { score: Math.max(1, score), label };
}
