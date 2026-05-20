import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { VIDEO_CINEMATIC_SYSTEM, buildVideoPrompt } from "@/prompts/video-cinematic";

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const {
      title, style, mood, theme, composition,
      duration, clipLength, sceneCount, segmentationMode,
    } = await req.json();

    const userPrompt = buildVideoPrompt({
      title, style, mood, theme, composition,
      duration: duration || "3:00",
      segmentationMode: segmentationMode || "split_by_duration",
      clipLength: parseInt(clipLength) || 10,
      sceneCount: parseInt(sceneCount) || 12,
    });

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: VIDEO_CINEMATIC_SYSTEM,
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
    console.error("Video error:", error);
    return new Response(JSON.stringify({ error: "Video generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}