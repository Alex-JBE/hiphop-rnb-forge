import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const { theme, styles, key, mood, result } = await req.json();

    const contextParts = [
      styles?.length ? `Genre: ${(styles as string[]).slice(0, 2).join(" + ")}` : null,
      key ? `Key: ${key}` : null,
      mood ? `Mood: ${mood}` : null,
      theme ? `Theme: ${String(theme).slice(0, 300)}` : null,
      result ? `Composition excerpt:\n${String(result).slice(0, 400)}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `Generate exactly ONE artist-ready track title for a hip-hop or R&B track.

CONTEXT:
${contextParts}

RULES:
- 2 to 5 words, no more
- Do NOT start with "A", "An", or "The"
- No sentence fragments, ellipses, or dashes separating phrases
- Poetic, visual, or emotionally resonant — like a real album track
- Good examples: "Stone Canyon Run", "Blackout Velocity", "Flame in the Courtyard", "Midnight Circuit", "Weight of Glass"
- No technical labels ("TITLE:", "Track:", etc.), no stray numbers
- If bilingual fits the theme, use a parenthetical: "Água Sem Forma (Water Without Form)"

Return ONLY the title text. No quotes, no trailing punctuation, nothing else.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const title = raw.replace(/^["']|["']$/g, "").trim();
    return Response.json({ title });
  } catch (error) {
    console.error("Title generation error:", error);
    return Response.json({ title: "" }, { status: 500 });
  }
}
