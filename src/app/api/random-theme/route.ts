import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Generate a cinematic scene for a hip-hop or R&B track and matching musical settings.

Return ONLY this exact JSON format, nothing else:
{
  "theme": "2-4 sentence cinematic scene, specific time, place, emotional detail, poetic but concrete",
  "style": "one of: Boom Bap, Trap, Neo-Soul, Contemporary R&B, Drill, Cloud Rap, Conscious Rap, Lo-Fi Hip-Hop, Alt-R&B, Melodic Trap",
  "key": "one of: A minor, D minor, F major, G minor, C major, Bb major, E minor, Ab major, F minor, C minor",
  "tempo": "one of: Lo-Fi Drift (60–80 BPM), Slow Jam (65–75 BPM), Neo-Soul Groove (80–95 BPM), Mid-Tempo Flow (85–100 BPM), Boom Bap Beat (90–100 BPM), Cruising Tempo (95–110 BPM), Trap Bounce (130–145 BPM), Drill Pace (140–160 BPM)",
  "intensity": 1, 2, 3, 4, or 5
}

Match the musical settings to the emotional world of the scene. Be creative and unexpected.`,
      }],
    });

    const text = message.content.filter(b => b.type === "text").map(b => b.type === "text" ? b.text : "").join("").trim();
    const data = JSON.parse(text.replace(/```json|```/g, "").trim());

    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Failed to generate theme" }), { status: 500 });
  }
}
