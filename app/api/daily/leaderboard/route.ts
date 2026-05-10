import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dailySeed } from "@/lib/sudoku";

const fallbackRows = [
  { rank: 1, username: "Aida", city: "Almaty", elapsed_seconds: 312, mistakes: 0, is_pro: true },
  { rank: 2, username: "Miras", city: "Astana", elapsed_seconds: 405, mistakes: 1, is_pro: false },
  { rank: 3, username: "Dana", city: "Almaty", elapsed_seconds: 498, mistakes: 1, is_pro: false }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? dailySeed();
  const city = searchParams.get("city");
  const supabase = createClient();

  if (!supabase) {
    const rows = city ? fallbackRows.filter((row) => row.city?.toLowerCase().includes(city.toLowerCase())) : fallbackRows;
    return NextResponse.json({ rows });
  }

  let query = supabase
    .from("daily_results")
    .select("username, city, elapsed_seconds, mistakes, is_pro")
    .eq("puzzle_date", date)
    .order("elapsed_seconds", { ascending: true })
    .order("mistakes", { ascending: true })
    .limit(50);

  if (city) query = query.ilike("city", `%${city}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ rows: fallbackRows });

  return NextResponse.json({
    rows: (data ?? []).map((row, index) => ({ ...row, rank: index + 1 }))
  });
}
