import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { HIPHOP_RNB_SYSTEM_PROMPT } from "@/prompts/base-prompt";

function buildUserPrompt(params: {
  title?: string;
  styles: string[];
  key?: string;
  tempo?: string;
  mood?: string;
  theme?: string;
  language?: string;
  trackMode?: string;
  vocalTone?: string;
  intensity?: number;
  instruments?: string[];
  notes?: string;
}): string {
  const {
    title,
    styles,
    key,
    tempo,
    mood,
    theme,
    language = "English",
    trackMode = "instrumental",
    vocalTone,
    intensity = 3,
    instruments = [],
    notes,
  } = params;

  const intensityMap: Record<number, string> = {
    1: "intimate, minimal, stripped-back",
    2: "smooth, laid-back, understated",
    3: "balanced, energetic, groove-forward",
    4: "hard-hitting, intense, high-energy",
    5: "maximum energy, aggressive, overwhelming",
  };

  const intensityDesc = intensityMap[intensity] || "balanced";
  const styleList = styles.join(", ");
  const isVocal = trackMode === "vocals";

  return `Create a COMPLETE, DETAILED, PRODUCTION-READY composition blueprint for the following track.

PARAMETERS:
- Genre / Style: ${styleList}
- Title: ${title || "(generate an appropriate title)"}
- Key: ${key || "(choose appropriate key for the style)"}
- Tempo: ${tempo || "(choose appropriate tempo for the style)"}
- Mood: ${mood || "(derive from style)"}
- Theme: ${theme || "(derive from mood and style)"}
- Intensity: ${intensity}/5 — ${intensityDesc}
- Language: ${language}
- Track Mode: ${isVocal ? `Vocals${vocalTone ? ` — ${vocalTone}` : ""}` : "Instrumental"}
${instruments.length > 0 ? `- Featured Instruments: ${instruments.join(", ")}` : ""}
${notes ? `- Additional Notes: ${notes}` : ""}

OUTPUT FORMAT (use exactly these labels):

TITLE: <finalized track title>
STYLE: <genre and stylistic blend>
KEY: <musical key>
TEMPO: <BPM range and feel>
FEEL: <emotional center and energy>

PRODUCTION BLUEPRINT:
<Detailed production notes covering:>
- Drum programming: kick, snare, hi-hat patterns, swing
- Bass design: 808 or bass style, notes, movement
- Harmonic elements: chords, pads, samples
- Melodic layers: leads, hooks, riffs
- Arrangement: intro, verse, chorus/hook, bridge, outro structure
- Mixing notes: compression, EQ, stereo field, effects

INSTRUMENT BREAKDOWN:
<List each instrument with its role, character, and key moments>

${isVocal ? `VOCAL ARRANGEMENT:
<Vocal style, delivery, lyrical cadence, harmonies, ad-libs, placement in mix>

[LYRICS]
<Complete lyrics in ${language} with section markers: [Intro], [Verse 1], [Chorus/Hook], [Verse 2], [Bridge], [Outro]>
` : ""}PRODUCTION NOTES:
<Branch-specific guidance, mixing red flags, production polish tips, reference tracks>`;
}

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const body = await req.json();

    const userPrompt = buildUserPrompt(body);

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: [{ type: "text" as const, text: HIPHOP_RNB_SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const } }],
      messages: [{ role: "user", content: userPrompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel