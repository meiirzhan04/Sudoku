import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dailySeed, generateSudoku } from "@/lib/sudoku";

export async function POST(request: Request) {
  const supabase = createClient();
  if (!supabase) return NextResponse.json({ ok: true, stored: "local" });

  const body = await request.json();
  const puzzleDate = body.puzzle_date ?? dailySeed();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let profile: { username: string | null; city: string | null; is_pro: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, city, is_pro")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const puzzle = generateSudoku("medium", puzzleDate);
  await supabase.from("daily_puzzles").upsert({
    puzzle_date: puzzleDate,
    seed: puzzleDate,
    puzzle: puzzle.puzzle,
    solution: puzzle.solution,
    difficulty: "medium"
  });

  const { error } = await supabase.from("daily_results").insert({
    puzzle_date: puzzleDate,
    user_id: user?.id ?? null,
    username: profile?.username ?? user?.email?.split("@")[0] ?? "Guest",
    city: profile?.city ?? null,
    elapsed_seconds: body.elapsed_seconds ?? 0,
    mistakes: body.mistakes ?? 0,
    accuracy: body.accuracy ?? 100,
    is_pro: profile?.is_pro ?? false
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
