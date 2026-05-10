"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();
    const { error } = await supabase?.auth.updateUser({ password }) ?? { error: new Error("Supabase is not configured") };
    if (error) setMessage(error.message);
    else router.push("/login");
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
