"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    const email = String(new FormData(event.currentTarget).get("email"));
    const { error } = await supabase?.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    }) ?? { error: new Error("Supabase is not configured") };
    setMessage(error ? error.message : t("auth.resetSent"));
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
