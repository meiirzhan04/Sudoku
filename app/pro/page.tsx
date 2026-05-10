"use client";

import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/components/ui/toast";

export default function ProPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const rows = [
    [t("pro.hintsFree"), t("pro.hintsPro")],
    [t("pro.themesFree"), t("pro.themesPro")],
    [t("pro.statsFree"), t("pro.statsPro")],
    [t("pro.bannerFree"), t("pro.bannerPro")]
  ];

  return (
    <div className="page-shell space-y-8">
      <div className="max-w-2xl space-y-3">
        <Badge variant="secondary">Stripe-ready</Badge>
        <h1 className="text-3xl font-semibold sm:text-4xl">{t("pro.title")}</h1>
        <p className="text-muted-foreground">{t("pro.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pro.price")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-start">{t("pro.free")}</th>
                <th className="py-3 text-start">
                  <span className="inline-flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    {t("pro.paid")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([free, pro]) => (
                <tr key={free} className="border-b last:border-0">
                  <td className="py-4 text-muted-foreground">{free}</td>
                  <td className="py-4 font-medium">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button className="mt-6" onClick={() => toast({ title: t("pro.checkout"), variant: "success" })}>
            {t("pro.checkout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
