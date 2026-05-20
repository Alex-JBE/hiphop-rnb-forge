import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { COVER_ART_DIRECTOR_SYSTEM, buildCoverArtPrompt } from "@/prompts/cover-art-director";

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const { title, style, mood, theme, composition } = await req.json();

    const userPrompt = buildCoverArtPrompt({ title, style, mood, theme, composition });

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: COVER_ART_DIRECTOR_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Cover error:", error);
    return new Response(JSON.stringify({ error: "Cover generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}