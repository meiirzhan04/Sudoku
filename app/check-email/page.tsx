"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/providers/language-provider";

export default function CheckEmailPage() {
  const { t } = useLanguage();
  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardHeader>
          <MailCheck className="mx-auto h-10 w-10 text-primary" />
          <CardTitle>{t("auth.checkEmail")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("auth.verifyCopy")}</p>
          <Button asChild>
            <Link href="/login">{t("auth.signIn")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
