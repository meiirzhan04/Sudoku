"use client";

import Link from "next/link";
import { Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/components/ui/toast";

type Mode = "login" | "register";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

function validPassword(password: string) {
  return password.length >= 8 && /[\p{L}]/u.test(password) && /\d/.test(password);
}

function backendUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}

export function AuthCard({ mode }: { mode: Mode }) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

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
        router.push("/check-email");
      } else {
        await login(form, email, password);
        toast({ title: t("auth.signIn"), variant: "success" });
        router.push(searchParams.get("next") ?? "/play");
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed. Check that backend is running.");
    } finally {
      setPending(false);
    }
  }

  async function register(form: FormData, email: string, password: string) {
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      throw new Error(t("auth.mismatch"));
    }

    const response = await fetch(`${backendUrl()}/api/auth/register`, {
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
    const response = await fetch(`${backendUrl()}/api/auth/login`, {
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
    document.cookie = `sm_access_token=${data.accessToken}; path=/; max-age=${
      rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
    }; SameSite=Lax`;
  }

  function google() {
    window.location.href = `${backendUrl()}/oauth2/authorization/google`;
  }

  const isRegister = mode === "register";

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
          <form onSubmit={onSubmit} className="space-y-4">
            {isRegister ? (
              <>
                <Field name="fullName" label={t("common.fullName")} autoComplete="name" />
                <Field name="username" label={t("common.username")} autoComplete="username" />
                <Field name="city" label={t("common.city")} autoComplete="address-level2" />
                <div className="space-y-2">
                  <Label htmlFor="avatar">
                    {t("common.avatar")} ({t("common.optional")})
                  </Label>
                  <Input id="avatar" name="avatar" type="file" accept="image/*" className="bg-background/70" />
                </div>
              </>
            ) : null}

            <Field name="email" label={t("common.email")} type="email" autoComplete="email" />
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
                />
                <button
                  type="button"
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isRegister ? (
              <Field
                name="confirmPassword"
                label={t("common.confirmPassword")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

            <Button type="submit" className="w-full" disabled={pending}>
              {isRegister ? t("auth.signUp") : t("auth.signIn")}
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
          </form>
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
  autoComplete
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} autoComplete={autoComplete} required className="bg-background/70" />
    </div>
  );
}
