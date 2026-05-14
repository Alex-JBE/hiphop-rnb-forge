import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const { genre } = await req.json();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Generate a creative track concept for a ${genre || "Boom Bap"} hip-hop or R&B track.

Return ONLY this exact JSON, nothing else:
{
  "title": "a compelling, specific track title (2-5 words)",
  "mood": "2-4 evocative mood descriptors separated by commas",
  "theme": "1-2 sentence cinematic scene or thematic concept, specific and poetic"
}

Be creative, specific, and genre-appropriate. Avoid clichés.`,
      }],
    });

    const text = message.content
      .filter(b => b.type === "text")
      .map(b => b.type === "text" ? b.text : "")
      .join("")
      .trim();

    const data = JSON.parse(text.replace(/```json|```/g, "").trim());
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Inspire failed" }), { status: 500 });
  }
}
