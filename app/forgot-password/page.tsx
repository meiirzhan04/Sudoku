"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/language-provider";

function backendUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email"));
    const response = await fetch(`${backendUrl()}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    setMessage(response.ok ? t("auth.resetSent") : "Request failed");
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
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button className="w-full">{t("auth.sendReset")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
