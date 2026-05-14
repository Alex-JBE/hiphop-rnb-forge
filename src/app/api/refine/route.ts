import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const { section, content, instruction } = await req.json();

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `You are a hip-hop & R&B music producer refining a composition section.

Section: ${section}
Current content:
${content}

Refinement instruction: ${instruction}

Rewrite the section following the instruction exactly. Keep the same format and structure. Output only the refined section content, no preamble.`,
      }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked", "X-Accel-Buffering": "no" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Refine failed" }), { status: 500 });
  }
}
