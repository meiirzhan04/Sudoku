import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeLocale } from "@/lib/i18n/messages";

export async function PATCH(request: Request) {
  const supabase = createClient();
  if (!supabase) return NextResponse.json({ ok: true, stored: "local" });

  const body = await request.json().catch(() => ({}));
  const language = normalizeLocale(body.language);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: true, stored: "local" });

  const { error } = await supabase.from("profiles").update({ language }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
