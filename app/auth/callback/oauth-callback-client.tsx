"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/providers/language-provider";

export function OAuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      router.replace("/login");
      return;
    }

    window.localStorage.setItem("sudokumind-access-token", accessToken);
    window.localStorage.setItem("sudokumind-refresh-token", refreshToken);
    window.localStorage.setItem("sudokumind-remember", "30");
    window.dispatchEvent(new Event("sudokumind-auth-updated"));
    document.cookie = `sm_access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    router.replace("/dashboard");
    router.refresh();
  }, [router, searchParams]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("auth.signIn")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("common.loading")}...</CardContent>
      </Card>
    </main>
  );
}
