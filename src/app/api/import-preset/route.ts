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
    const { description, text: legacyText } = await req.json();
    const text = description || legacyText;

    const prompt = `You are a music analyst. Parse the following text and extract musical parameters for a hip-hop & R&B composition tool.

TEXT: "${text}"

Extract as much as you can. For styles, pick ONLY from this exact list:
${ALL_STYLES.join(", ")}

Return ONLY valid JSON, no markdown:
{
  "styles": ["up to 3 styles from the list"],
  "key": "one of: A minor, D minor, F major, G minor, C major, Bb major, E minor, Ab major, F minor, C minor, G major, B minor — or null",
  "tempo": "one of: Lo-Fi Drift (60–80 BPM), Slow Groove (80–95 BPM), Mid Trap (95–120 BPM), Bounce (120–140 BPM), Drill Pace (140–160 BPM) — or null",
  "intensity": 1-5 or null,
  "instruments": ["instruments mentioned — only from: 808 Bass, Trap Kick, Live Drums, Hi-Hats, Piano, Rhodes, Synth Pads, Vinyl Sample, Horns, Strings, Guitar Loop, Vocal Chops, Bass Guitar, Organ"],
  "vocalTone": "one of: Rapping, Melodic Rap, Sung R&B, Auto-Tune, Harmonized, Spoken Word, Whispering, Ad-Libs, Choir, Falsetto — or null",
  "theme": "1-2 sentence summary of the mood/scene, in English"
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content.filter(b => b.type === "text").map(b => b.type === "text" ? b.text : "").join("").trim();
    const data = JSON.parse(raw.replace(/```json|```/g, "").trim());

    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Import failed" }), { status: 500 });
  }
}
