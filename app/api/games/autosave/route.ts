import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  if (!supabase) return NextResponse.json({ ok: true, stored: "local" });

  const body = await request.json();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: true, stored: "local" });

  const { error } = await supabase.from("games").insert({
    user_id: user.id,
    puzzle: body.puzzle,
    solution: body.solution,
    entries: body.entries,
    notes: body.notes ?? {},
    difficulty: body.difficulty,
    elapsed_seconds: body.elapsed_seconds ?? 0,
    mistakes: body.mistakes ?? 0,
    accuracy: body.accuracy ?? 100,
    completed_at: body.completed ? new Date().toISOString() : null
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
