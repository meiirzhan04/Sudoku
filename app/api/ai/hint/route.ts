import { NextResponse } from "next/server";
import { messages, normalizeLocale } from "@/lib/i18n/messages";

function localFallback(locale: "en" | "ru" | "kk", digit: number, valid: boolean) {
  const template = valid ? messages[locale].ai.fallback : messages[locale].ai.invalid;
  return template.replaceAll("{digit}", String(digit));
}

export async function POST(request: Request) {
  const body = await request.json();
  const locale = normalizeLocale(body.locale);
  const digit = Number(body.digit);
  const valid = Array.isArray(body.candidates) ? body.candidates.includes(digit) : true;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      message: localFallback(locale, digit, valid),
      source: "local"
    });
  }

  try {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const language = locale === "ru" ? "Russian" : locale === "kk" ? "Kazakh" : "English";
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 220,
      temperature: 0.2,
      system: `You are SudokuMind's concise Sudoku coach. Answer only in ${language}. Teach named strategies when useful: naked singles, hidden pairs, X-wing. Do not reveal unrelated cells.`,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            row: body.row,
            col: body.col,
            digit,
            candidates: body.candidates,
            entries: body.entries,
            puzzle: body.puzzle
          })
        }
      ]
    });

    const text = response.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim();

    return NextResponse.json({ message: text || localFallback(locale, digit, valid), source: "anthropic" });
  } catch {
    return NextResponse.json({ message: localFallback(locale, digit, valid), source: "local" });
  }
}
