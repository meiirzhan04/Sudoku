"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/language-provider";

function backendUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password !== confirm) {
      setMessage(t("auth.mismatch"));
      return;
    }
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    const response = await fetch(`${backendUrl()}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword: confirm })
    });
    if (response.ok) router.push("/login");
    else setMessage("Request failed");
  }

  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.resetTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.newPassword")}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t("common.confirmPassword")}</Label>
              <Input id="confirm" name="confirm" type="password" required />
            </div>
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <Button className="w-full">{t("auth.updatePassword")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
