"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase?.auth.getSession().finally(() => {
      window.setTimeout(() => router.push("/play"), 900);
    });
  }, [router]);

  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="skeleton h-3 w-2/3" />
            <p className="text-sm text-muted-foreground">{t("auth.verified")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
