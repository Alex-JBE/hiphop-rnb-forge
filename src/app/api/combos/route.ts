import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const ALL_STYLES = [
  "Boom Bap","Jazz Rap","G-Funk","East Coast","West Coast",
  "Trap","Drill","Dark Trap","Melodic Trap","Trap Soul",
  "Contemporary R&B","Neo-Soul","Alt-R&B","New Jack Swing","90s R&B",
  "Conscious Rap","Alternative Hip-Hop","Cloud Rap","Emo Rap","Lo-Fi Hip-Hop",
  "Crunk","Hyphy","Bounce","Jersey Club","Afrobeats Rap",
  "Abstract Hip-Hop","Noise Rap","Industrial Rap","Glitch Hop","Art Rap",
  "Dirty South","Memphis Rap","Houston Screw","Atlanta Trap","New Orleans Bounce",
  "Gospel Rap","Soul Rap","Inspirational R&B","Spiritual Rap","Neo-Gospel",
  "Latin Trap","Reggaeton","Dancehall","Afrobeats","Amapiano",
  "R&B-Rap","Pop Rap","Indie R&B","Folk Rap","Jazz Rap Fusion",
];

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const { styles } = await req.json();
    const style = Array.isArray(styles) ? styles[0] : styles;

    const prompt = `You are a hip-hop & R&B music expert. Given the style "${style}", suggest exactly 8 creative style combinations (2-3 styles each) that would blend well with "${style}".

Rules:
- Each combo must include "${style}" as one of the styles
- The other styles must be chosen ONLY from this list: ${ALL_STYLES.join(", ")}
- Each combo should have a different sonic character
- Give each combo a short evocative label (2-3 words max) and a relevant emoji

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "combos": [
    { "icon": "🌙", "label": "Midnight Vibe", "styles": ["${style}", "Style2"] },
    { "icon": "🔥", "label": "Hard Knock", "styles": ["${style}", "Style2", "Style3"] }
  ]
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const data = JSON.parse(text.replace(/```json|```/g, "").trim());

    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Combos generation failed" }), { status: 500 });
  }
}
