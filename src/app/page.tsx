"use client";

import { useState, useRef, useEffect } from "react";
import CoverPanel from "@/components/CoverPanel";
import VideoPanel from "@/components/VideoPanel";
import Header from "@/components/Header";
import ResultPanel from "@/components/ResultPanel";
import DraftsPanel from "@/components/DraftsPanel";
import { useDrafts } from "@/lib/useDrafts";
import { exportTXT } from "@/lib/export";
import { buildPromptParts } from "@/prompts/base-prompt";
import useDualPromptFlow from "@/lib/useDualPromptFlow";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STYLE_CATEGORIES = [
  { id: "classic",     label: "Classic",      variant: "purple" as const, subs: ["Boom Bap", "Jazz Rap", "East Coast", "Golden Era", "Hardcore Hip-Hop"] },
  { id: "trap",        label: "Trap & Drill",  variant: "amber"  as const, subs: ["Trap", "Dark Trap", "Melodic Trap", "Drill", "UK Drill"] },
  { id: "rnb",         label: "R&B",           variant: "purple" as const, subs: ["Contemporary R&B", "Neo-Soul", "Alt-R&B", "90s R&B", "New Jack Swing"] },
  { id: "conscious",   label: "Conscious",     variant: "amber"  as const, subs: ["Conscious Rap", "Alt Hip-Hop", "Emo Rap", "Lo-Fi Hip-Hop", "Spoken Word"] },
  { id: "club",        label: "Club & Party",  variant: "purple" as const, subs: ["Crunk", "Bounce", "Hyphy", "Jersey Club", "Twerk"] },
  { id: "experimental",label: "Experimental",  variant: "amber"  as const, subs: ["Cloud Rap", "Phonk", "Glitch Hop", "Noise Rap", "Vaporwave Hip-Hop"] },
  { id: "southern",    label: "Southern",      variant: "purple" as const, subs: ["G-Funk", "West Coast", "Dirty South", "Memphis Rap", "Chopped & Screwed"] },
  { id: "soul",        label: "Gospel & Soul", variant: "amber"  as const, subs: ["Gospel Rap", "Soul Rap", "Trap Soul", "Inspirational", "Neo-Gospel"] },
  { id: "latin",       label: "Latin & World", variant: "purple" as const, subs: ["Latin Trap", "Reggaeton Hip-Hop", "Afrobeats Rap", "Amapiano", "Dancehall Rap"] },
  { id: "hybrid",      label: "Hybrid",        variant: "amber"  as const, subs: ["Pop Rap", "Rap Rock", "Country Rap", "K-Hip-Hop", "Grime"] },
];

const INSTRUMENTS = [
  "808 Bass", "Trap Kick", "Live Drums", "Hi-Hats", "Piano",
  "Rhodes", "Synth Pads", "Vinyl Sample", "Horns", "Strings",
  "Guitar Loop", "Vocal Chops", "Bass Guitar", "Organ",
];

const EXOTIC_INSTRUMENTS = [
  "Steel Drum", "Koto", "Oud", "Sitar", "Tabla", "Djembe",
  "Kalimba", "Marimba", "Balafon", "Pandeiro", "Mbira", "Kora",
  "Duduk", "Bansuri", "Gamelan", "Shamisen",
];

const LANGUAGES = [
  "English","Russian","Spanish","French","Portuguese","German","Italian",
  "Japanese","Korean","Arabic","Hindi","Chinese","Turkish","Hebrew",
  "Dutch","Swedish","Polish","Czech","Ukrainian","Greek","Romanian",
  "Swahili","Yoruba","Amharic","Vietnamese","Indonesian","Bengali","Punjabi",
];

const KEYS = [
  "A minor","D minor","F major","G minor","C major",
  "Bb major","E minor","Ab major","F minor","C minor","G major","B minor",
];

const TEMPOS = [
  "Lo-Fi Drift (60–80 BPM)",
  "Slow Jam (65–75 BPM)",
  "Neo-Soul Groove (80–95 BPM)",
  "Mid-Tempo Flow (85–100 BPM)",
  "Boom Bap Beat (90–100 BPM)",
  "Cruising Tempo (95–110 BPM)",
  "Trap Bounce (130–145 BPM)",
  "Drill Pace (140–160 BPM)",
];

const INTENSITY_LABELS = ["", "Intimate", "Smooth", "Energetic", "Hard", "Maximum"];

const MOOD_PRESETS = [
  { icon: "\u{1F303}", label: "Night",  key: "F minor",  tempo: "Mid-Tempo Flow (85–100 BPM)", intensity: 2, styles: ["Trap Soul", "Cloud Rap"] },
  { icon: "☀️", label: "Summer", key: "G major",  tempo: "Cruising Tempo (95–110 BPM)", intensity: 3, styles: ["West Coast", "G-Funk"] },
  { icon: "\u{1F494}", label: "Sad",    key: "A minor",  tempo: "Slow Jam (65–75 BPM)", intensity: 2, styles: ["Emo Rap", "Alt-R&B"] },
  { icon: "\u{1F4AA}", label: "Flex",   key: "C minor",  tempo: "Trap Bounce (130–145 BPM)", intensity: 4, styles: ["Trap", "Drill"] },
  { icon: "\u{1F300}", label: "Chill",  key: "Bb major", tempo: "Lo-Fi Drift (60–80 BPM)", intensity: 1, styles: ["Lo-Fi Hip-Hop", "Neo-Soul"] },
  { icon: "\u{1F525}", label: "Club",   key: "D minor",  tempo: "Drill Pace (140–160 BPM)", intensity: 5, styles: ["Jersey Club", "Bounce"] },
];

const VOCAL_STYLES = [
  "Rapping", "Melodic Rap", "Sung R&B", "Auto-Tune",
  "Harmonized", "Spoken Word", "Whispering", "Ad-Libs", "Choir", "Falsetto",
];

type TrackMode = "vocal" | "instrumental";

// ─── Style helpers ─────────────────────────────────────────────────────────────

const s = {
  col: { display: "flex" as const, flexDirection: "column" as const, height: "100%", overflow: "hidden" as const },
  sectionLabel: { fontSize: "11px", letterSpacing: "0.12em", color: "var(--purple-dim)", textTransform: "uppercase" as const, padding: "14px 16px 8px", fontWeight: 500 },
  paramCard: { background: "#1A1020", border: "1px solid #2A1F3A", borderRadius: "8px", padding: "10px 12px" },
  paramLabel: { fontSize: "10px", color: "#8C829D", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "6px", fontWeight: 500 },
  select: { width: "100%", background: "transparent", border: "none", color: "#F5F1FA", fontSize: "13px", fontWeight: 500, outline: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  tag: (active: boolean) => ({
    fontSize: "12px", padding: "5px 12px", borderRadius: "20px",
    border: `1px solid ${active ? "#7C3AED" : "#2A2A30"}`,
    background: active ? "#2D1B69" : "#1A1A1F",
    color: active ? "#C084FC" : "#B8B2A8",
    cursor: "pointer" as const, transition: "all 0.15s", fontWeight: active ? 500 : 400,
  }),
  amberTag: (active: boolean) => ({
    fontSize: "12px", padding: "5px 12px", borderRadius: "20px",
    border: `1px solid ${active ? "#F59E0B" : "#2A2A30"}`,
    background: active ? "#2A1A00" : "#1A1A1F",
    color: active ? "#FCD34D" : "#B8B2A8",
    cursor: "pointer" as const, transition: "all 0.15s", fontWeight: active ? 500 : 400,
  }),
  purpleTag: (active: boolean) => ({
    fontSize: "12px", padding: "5px 12px", borderRadius: "20px",
    border: `1px solid ${active ? "#A855F7" : "#2A2A30"}`,
    background: active ? "#1A1020" : "#1A1A1F",
    color: active ? "#A855F7" : "#B8B2A8",
    cursor: "pointer" as const, transition: "all 0.15s", fontWeight: active ? 500 : 400,
  }),
};

function getVariantForStyle(st: string): "purple" | "amber" {
  const cat = STYLE_CATEGORIES.find(c => c.label === st || c.subs.includes(st));
  return cat?.variant ?? "purple";
}

function deriveTitleFromTheme(theme: string): string {
  if (!theme.trim()) return "";
  const cleaned = theme
    .replace(/["""''`]/g, "")
    .replace(/[,.:;!?|*<>\\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean).slice(0, 5);
  if (!words.length) return "";
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 60);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Home() {
  const [activeStyles, setActiveStyles] = useState<string[]>(["Boom Bap"]);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [key, setKey] = useState("A minor");
  const [tempo, setTempo] = useState("Boom Bap Beat (90–100 BPM)");
  const [intensity, setIntensity] = useState(3);
  const [instruments, setInstruments] = useState<string[]>(["808 Bass", "Piano"]);
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("");
  const [trackMode, setTrackMode] = useState<TrackMode>("vocal");
  const [vocalStyle, setVocalStyle] = useState("Rapping");
  const [importText, setImportText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [combos, setCombos] = useState<{ icon: string; label: string; styles: string[] }[]>([]);
  const [combosLoading, setCombosLoading] = useState(false);
  const [combosForStyle, setCombosForStyle] = useState("");
  const [result, setResult] = useState("");
  const [coverResult, setCoverResult] = useState("");
  const [videoResult, setVideoResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inspireLoading, setInspireLoading] = useState(false);
  const [randomLoading, setRandomLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const { drafts, saveDraft, deleteDraft, toggleStar } = useDrafts();
  const styleBlockRef = useRef<HTMLDivElement>(null);
  const themeTitle = deriveTitleFromTheme(theme);
  const resultTitle = result.split("\n").find(l => /^#?\s*TITLE:/i.test(l))?.replace(/^#?\s*TITLE:/i, "").trim();
  const compositionTitle = themeTitle || resultTitle || "";
  const instrumental = trackMode === "instrumental";

  async function buildShortPrompt(): Promise<string> {
    if (!result && !theme && !activeStyles.length) throw new Error("NO_INPUT");
    const brief = result || [
      `Hip-hop & R&B track in ${activeStyles.join(" + ")} style`,
      `Key: ${key}`,
      `Tempo: ${tempo}`,
      `Intensity: ${INTENSITY_LABELS[intensity]}`,
      `Instruments: ${instruments.join(", ")}`,
      language !== "English" ? `Language: ${language}` : null,
      theme ? `Theme: ${theme}` : null,
    ].filter(Boolean).join(". ");
    const res = await fetch("/api/suno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        composition: brief,
        title: compositionTitle || "Hip-Hop Track",
        trackLength: "medium",
        vocal: trackMode === "vocal" ? vocalStyle : "",
      }),
    });
    if (!res.ok || !res.body) throw new Error("SUNO_API_ERROR");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
    }
    return acc;
  }

  const fingerprint = `${activeStyles.join("+")}|${key}|${tempo}|${intensity}|${trackMode}|${vocalStyle}|${language}|${instruments.join(",")}|${theme}`;
  const flow = useDualPromptFlow({ fingerprint, fullResult: result, buildShortPrompt });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (styleBlockRef.current && !styleBlockRef.current.contains(e.target as Node)) {
        setOpenCat(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function clearAll() {
    setResult(""); setCoverResult(""); setVideoResult(""); setTheme("");
    setActiveStyles(["Boom Bap"]); setKey("A minor");
    setTempo("Boom Bap Beat (90–100 BPM)"); setIntensity(3);
    setInstruments(["808 Bass", "Piano"]); setLanguage("English");
    setTrackMode("vocal"); setVocalStyle("Rapping");
    setCombos([]); setCombosForStyle(""); setOpenCat(null);
    setResetKey(k => k + 1);
    flow.resetFlow();
  }

  function randomizeAll() {
    const allSubs = STYLE_CATEGORIES.flatMap(c => c.subs);
    const shuffled = [...allSubs].sort(() => Math.random() - 0.5);
    setActiveStyles(shuffled.slice(0, 2));
    setKey(KEYS[Math.floor(Math.random() * KEYS.length)]);
    setTempo(TEMPOS[Math.floor(Math.random() * TEMPOS.length)]);
    setIntensity(Math.floor(Math.random() * 5) + 1);
    setCombos([]); setCombosForStyle("");
  }

  function toggleStyle(st: string) {
    setActiveStyles(prev => {
      if (prev.includes(st)) return prev.length > 1 ? prev.filter(x => x !== st) : prev;
      if (prev.length >= 3) return prev;
      return [...prev, st];
    });
  }

  function removeStyle(st: string) {
    setActiveStyles(prev => prev.length > 1 ? prev.filter(x => x !== st) : prev);
  }

  function isCatActive(cat: typeof STYLE_CATEGORIES[0]) {
    return activeStyles.includes(cat.label) || cat.subs.some(sub => activeStyles.includes(sub));
  }

  function toggleInstrument(i: string) {
    setInstruments(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  async function inspire() {
    setInspireLoading(true);
    setTheme("");
    try {
      const res = await fetch("/api/inspire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre: activeStyles[0] || "Boom Bap" }),
      });
      const data = await res.json();
      if (data.theme) setTheme(data.theme);
    } catch {}
    finally { setInspireLoading(false); }
  }

  async function randomTheme() {
    setRandomLoading(true);
    setTheme("");
    try {
      const res = await fetch("/api/random-theme", { method: "POST" });
      const data = await res.json();
      if (data.theme) setTheme(data.theme);
      if (data.style) setActiveStyles([data.style]);
      if (data.key) setKey(data.key);
      if (data.tempo) setTempo(data.tempo);
      if (data.intensity) setIntensity(data.intensity);
    } catch {
      setTheme("Late night city drive, neon lights reflecting off wet pavement...");
    } finally { setRandomLoading(false); }
  }

  async function importPreset() {
    if (!importText.trim()) return;
    setImportLoading(true); setImportDone(false);
    try {
      const res = await fetch("/api/import-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: importText }),
      });
      const data = await res.json();
      if (data.styles?.length) setActiveStyles(data.styles);
      if (data.key) setKey(data.key);
      if (data.tempo) setTempo(data.tempo);
      if (data.intensity) setIntensity(data.intensity);
      if (data.instruments?.length) setInstruments(data.instruments);
      if (data.vocalTone) setVocalStyle(data.vocalTone);
      if (data.theme) setTheme(data.theme);
      setImportDone(true); setImportText("");
      setTimeout(() => setImportDone(false), 2000);
    } catch {}
    finally { setImportLoading(false); }
  }

  async function findCombos() {
    const style = activeStyles[0];
    setCombosLoading(true); setCombos([]); setCombosForStyle(style);
    try {
      const res = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styles: activeStyles }),
      });
      const data = await res.json();
      if (data.combos) setCombos(data.combos);
    } catch { setCombos([]); }
    finally { setCombosLoading(false); }
  }

  async function generate() {
    const inputFingerprint = fingerprint;
    setLoading(true); setIsStreaming(true);
    setResult(""); setCoverResult(""); setVideoResult("");
    flow.onForgeStart();
    try {
      const { system, user } = buildPromptParts({
        branch: activeStyles.join(" + "),
        groove: tempo,
        texture: key,
        mood: INTENSITY_LABELS[intensity],
        voiceMode: trackMode === "vocal" ? vocalStyle : "Instrumental",
        theme,
        instruments,
        language,
      });
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: user, system }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        setResult(`Generation failed (${res.status}): ${errText}`);
        return;
      }
      if (!res.body) {
        setResult("Error: no response body from generation API.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setResult(acc);
      }
      flow.onForgeComplete(inputFingerprint);
    } catch (e) {
      console.error(e);
      setResult("Error connecting to generation API.");
    } finally { setLoading(false); setIsStreaming(false); }
  }

  function buildSunoPrompt() { flow.buildSunoPrompt(); }

  const panelComposition =
    flow.viewMode === "suno"
      ? [flow.sunoPrompt?.styleBlock, flow.sunoPrompt?.lyricsBlock].filter(Boolean).join("\n\n").trim()
      : result;
  const panelCompositionLoading =
    flow.viewMode === "suno" ? flow.sunoPromptLoading : isStreaming;

  // Style name for hero heading
  const heroStyle = activeStyles.length === 1 ? activeStyles[0] : activeStyles.slice(0, 2).join(" × ");
  const heroVariant = getVariantForStyle(activeStyles[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <Header
        title={compositionTitle}
        composition={result}
        coverResult={coverResult}
        videoResult={videoResult}
        vocalTone={trackMode === "vocal" ? vocalStyle : ""}
        style={activeStyles.join(" + ")}
        language={language}
        onClear={clearAll}
        sunoPrompt={flow.sunoPrompt}
        viewMode={flow.viewMode}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", flex: 1, overflow: "hidden" }}>

        {/* COVER PANEL */}
        <CoverPanel
          key={`cover-${resetKey}`}
          title={compositionTitle}
          style={activeStyles.join(" + ")}
          mood={INTENSITY_LABELS[intensity]}
          theme={theme}
          composition={panelComposition}
          compositionLoading={panelCompositionLoading}
          onResult={setCoverResult}
        />

        {/* LEFT PANEL */}
        <div style={{ ...s.col, background: "var(--bg-secondary)", borderRight: "1px solid var(--border)" }}>

          {/* Hero */}
          <div style={{ padding: "32px 20px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "44px", fontWeight: 700, color: "#F5F1FA", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
              Forge your next
              <br />
              <span style={{ color: heroVariant === "purple" ? "#A855F7" : "#F59E0B", fontStyle: "italic" }}>
                {heroStyle.toLowerCase()} track
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#8C829D", marginTop: "10px", lineHeight: 1.4 }}>
              Select style, set parameters, generate.
            </div>

            {/* Mood presets */}
            <div style={{ display: "flex", gap: "5px", marginTop: "10px", flexWrap: "wrap" as const }}>
              {MOOD_PRESETS.map(p => (
                <button key={p.label} onClick={() => { setKey(p.key); setTempo(p.tempo); setIntensity(p.intensity); setActiveStyles(p.styles); }}
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "20px", border: "1px solid #2A1F3A", background: "#1A1020", color: "#B8B2A8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            {/* Inspire + Random */}
            <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
              <button onClick={inspire} disabled={inspireLoading} style={{ flex: 1, padding: "8px 14px", background: inspireLoading ? "#1A1020" : "#1A1020", border: `1px solid ${inspireLoading ? "#3B1F6A" : "#A855F7"}`, borderRadius: "8px", color: inspireLoading ? "#8C829D" : "#A855F7", fontSize: "12px", fontWeight: 500, cursor: inspireLoading ? "not-allowed" : "pointer", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
                {inspireLoading ? "Generating..." : "✶ Inspire Me"}
              </button>
              <button onClick={randomizeAll} title="Randomize everything"
                style={{ padding: "8px 12px", background: "#1A1020", border: "1px solid #2A1F3A", borderRadius: "8px", color: "#B8B2A8", fontSize: "16px", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#A855F7"; e.currentTarget.style.color = "#A855F7"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2A1F3A"; e.currentTarget.style.color = "#B8B2A8"; }}>
                🎲
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={s.sectionLabel}>Style</div>

            {/* Style grid */}
            <div ref={styleBlockRef} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", padding: "0 12px" }}>
              {STYLE_CATEGORIES.map(cat => {
                const active = isCatActive(cat);
                const isOpen = openCat === cat.id;
                const v = cat.variant;
                const activeColor = v === "purple" ? "#A855F7" : "#F59E0B";
                const activeBg = v === "purple" ? "#2D1B69" : "#2A1A00";
                const activeBorder = v === "purple" ? "#6D28D9" : "#B45309";
                const activeText = v === "purple" ? "#C084FC" : "#FCD34D";
                return (
                  <div key={cat.id} style={{ position: "relative" }}>
                    <div style={{ display: "flex", borderRadius: "20px", border: `1px solid ${active ? activeBorder : "#2A2A30"}`, background: active ? activeBg : "#1A1A1F", overflow: "hidden", transition: "all 0.15s" }}>
                      <button onClick={() => { toggleStyle(cat.label); setOpenCat(null); }} style={{ flex: 1, fontSize: "12px", padding: "6px 4px 6px 10px", background: "transparent", border: "none", color: active ? activeText : "#B8B2A8", cursor: "pointer", textAlign: "left" as const, fontWeight: active ? 500 : 400, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cat.label}
                      </button>
                      <button onClick={() => setOpenCat(isOpen ? null : cat.id)} style={{ width: "22px", background: "transparent", border: "none", borderLeft: `1px solid ${active ? activeBorder : "#2A2A30"}`, color: active ? activeColor : "#888", cursor: "pointer", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                        ▾
                      </button>
                    </div>
                    {isOpen && (
                      <div style={{ position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0, background: "#1E1626", border: "1px solid #3A2A50", borderRadius: "10px", zIndex: 50, overflow: "hidden", minWidth: "110px" }}>
                        {cat.subs.map((sub, idx) => {
                          const subActive = activeStyles.includes(sub);
                          return (
                            <button key={sub} onClick={() => toggleStyle(sub)} style={{ display: "block", width: "100%", textAlign: "left" as const, padding: "7px 12px", background: subActive ? (v === "purple" ? "#1A1428" : "#1A1000") : "transparent", border: "none", borderBottom: idx < cat.subs.length - 1 ? "1px solid #2A2035" : "none", color: subActive ? (v === "purple" ? "#C084FC" : "#FCD34D") : "#B8B2A8", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active style chips */}
            <div style={{ padding: "8px 12px 0", display: "flex", flexWrap: "wrap" as const, gap: "5px" }}>
              {activeStyles.map(st => {
                const v = getVariantForStyle(st);
                return (
                  <div key={st} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "3px 8px 3px 10px", borderRadius: "20px", border: `1px solid ${v === "purple" ? "#6D28D9" : "#B45309"}`, background: v === "purple" ? "#2D1B69" : "#2A1A00", color: v === "purple" ? "#C084FC" : "#FCD34D" }}>
                    <span>{st}</span>
                    <button onClick={() => removeStyle(st)} style={{ background: "none", border: "none", color: v === "purple" ? "#A855F7" : "#F59E0B", cursor: "pointer", fontSize: "12px", lineHeight: 1, padding: "0 0 0 2px" }}>×</button>
                  </div>
                );
              })}
            </div>

            {activeStyles.length >= 2 && (
              <div style={{ margin: "6px 12px 0", padding: "7px 10px", background: "#1A1428", border: "1px solid #3A2A60", borderRadius: "6px", fontSize: "11px", color: "#B8A0F0" }}>
                Blend mode — {activeStyles.length} styles active
              </div>
            )}

            <div style={{ height: "1px", background: "var(--border)", margin: "12px 0" }} />

            {/* Style Combos */}
            <div style={{ padding: "0 12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: "var(--purple-dim)", textTransform: "uppercase" as const, fontWeight: 500 }}>Style Combos</div>
                <button onClick={findCombos} disabled={combosLoading} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${combosLoading ? "#2A2A30" : "#A855F7"}`, background: combosLoading ? "#1A1A1F" : "#1A1020", color: combosLoading ? "#8C829D" : "#A855F7", cursor: combosLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {combosLoading ? "Finding..." : `✶ Find for ${activeStyles[0]}`}
                </button>
              </div>
              {combos.length === 0 && !combosLoading && (
                <div style={{ fontSize: "11px", color: "#777", fontStyle: "italic", textAlign: "center" as const, padding: "12px 0" }}>Pick a style, then click Find</div>
              )}
              {combosLoading && (
                <div style={{ fontSize: "11px", color: "var(--purple-dim)", textAlign: "center" as const, padding: "12px 0" }}>
                  <span style={{ color: "#A855F7" }}>●</span> Generating combos for {combosForStyle}...
                </div>
              )}
              {combos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                  {combos.map((combo) => {
                    const comboStyles = Array.isArray(combo.styles) ? combo.styles : (typeof combo === "string" ? [combo] : []);
                    const isActive = comboStyles.length > 0 && comboStyles.every(s => activeStyles.includes(s));
                    const label = combo.label || (typeof combo === "string" ? combo : "");
                    const icon = combo.icon || "";
                    return (
                      <button key={label} onClick={() => comboStyles.length > 0 && setActiveStyles(comboStyles)} style={{ fontSize: "11px", padding: "7px 8px", borderRadius: "8px", border: `1px solid ${isActive ? "#A855F7" : "#2A2A30"}`, background: isActive ? "#1A1020" : "#1A1A1F", color: isActive ? "#A855F7" : "#B8B2A8", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" as const }}>
                        <div style={{ marginBottom: "2px" }}>{icon} {label}</div>
                        <div style={{ fontSize: "10px", opacity: 0.6, lineHeight: 1.3 }}>{comboStyles.join(" · ")}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ height: "1px", background: "var(--border)", margin: "12px 0" }} />

            {/* History */}
            <div style={s.sectionLabel}>History</div>
            <DraftsPanel
              drafts={drafts}
              onLoad={(draft) => {
                setActiveStyles(draft.styles);
                setResult(draft.result);
                if (draft.key) setKey(draft.key);
                if (draft.tempo) setTempo(draft.tempo);
                if (draft.intensity) setIntensity(draft.intensity ?? 3);
                if (draft.language) setLanguage(draft.language);
                if (draft.trackMode) setTrackMode(draft.trackMode as TrackMode);
                if (draft.instruments) setInstruments(draft.instruments);
                if (draft.outputType) setVocalStyle(draft.outputType);
                if (draft.theme) setTheme(draft.theme);
              }}
              onDelete={deleteDraft}
              onStar={toggleStar}
            />
          </div>
        </div>

        {/* MAIN PANEL */}
        <div style={{ ...s.col, background: "var(--bg-primary)" }}>

          {/* Key / Tempo / Intensity */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div style={s.paramCard}>
                <div style={s.paramLabel}>Key</div>
                <select style={s.select} value={key} onChange={e => setKey(e.target.value)}>
                  {KEYS.map(k => <option key={k} style={{ background: "#141418" }}>{k}</option>)}
                </select>
              </div>
              <div style={s.paramCard}>
                <div style={s.paramLabel}>Tempo</div>
                <select style={s.select} value={tempo} onChange={e => setTempo(e.target.value)}>
                  {TEMPOS.map(t => <option key={t} style={{ background: "#141418" }}>{t}</option>)}
                </select>
              </div>
              <div style={s.paramCard}>
                <div style={s.paramLabel}>Intensity</div>
                <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setIntensity(n)} style={{ height: "6px", flex: 1, borderRadius: "2px", border: "none", background: n <= intensity ? "#A855F7" : "var(--border)", cursor: "pointer" }} />
                  ))}
                </div>
                <div style={{ fontSize: "11px", color: "var(--purple-dim)", marginTop: "5px" }}>{INTENSITY_LABELS[intensity]}</div>
              </div>
            </div>
          </div>

          {/* Scrollable params */}
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column" as const, gap: "12px" }}>

              {/* Theme */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={s.paramLabel}>Theme / Scene</div>
                  <button onClick={randomTheme} disabled={randomLoading} title="Random theme"
                    style={{ background: "none", border: "1px solid #2A2A30", borderRadius: "6px", color: randomLoading ? "#8C829D" : "#B8B2A8", fontSize: "14px", cursor: randomLoading ? "not-allowed" : "pointer", padding: "2px 8px", lineHeight: 1 }}
                    onMouseEnter={e => { if (!randomLoading) { e.currentTarget.style.borderColor = "#A855F7"; e.currentTarget.style.color = "#A855F7"; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#2A2A30"; e.currentTarget.style.color = randomLoading ? "#8C829D" : "#B8B2A8"; }}>
                    {randomLoading ? "⟳" : "\u{1F3B2}"}
                  </button>
                </div>
                <textarea value={theme} onChange={e => setTheme(e.target.value)} placeholder="Late night city streets, neon lights, hustle and reflection..." style={{ width: "100%", height: "80px", background: "#141418", border: "1px solid #2A1F3A", borderRadius: "8px", padding: "8px 12px", color: "var(--text-secondary)", fontSize: "12px", resize: "none" as const, outline: "none", fontFamily: "'DM Mono', monospace", lineHeight: "1.7", boxSizing: "border-box" as const }} />
              </div>

              {/* Import Preset */}
              <div>
                <div style={s.paramLabel}>Import Preset</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste any Suno preset, description, or idea..." style={{ flex: 1, height: "56px", background: "#141418", border: "1px solid #2A1F3A", borderRadius: "8px", padding: "8px 12px", color: "var(--text-secondary)", fontSize: "12px", resize: "none" as const, outline: "none", fontFamily: "'DM Mono', monospace", lineHeight: "1.5", boxSizing: "border-box" as const }} />
                  <button onClick={importPreset} disabled={importLoading || !importText.trim()} style={{ padding: "0 14px", borderRadius: "8px", border: "none", background: importDone ? "#2D1B69" : importLoading || !importText.trim() ? "#1A1A1F" : "#A855F7", color: importDone ? "#C084FC" : importLoading || !importText.trim() ? "#8C829D" : "#0D0D0F", fontSize: "12px", fontWeight: 600, cursor: importLoading || !importText.trim() ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" as const }}>
                    {importDone ? "Done ✓" : importLoading ? "..." : "Import ↗"}
                  </button>
                </div>
              </div>

              {/* Instrumentation */}
              <div>
                <div style={s.paramLabel}>Instrumentation</div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "5px" }}>
                  {INSTRUMENTS.map(i => <button key={i} onClick={() => toggleInstrument(i)} style={s.tag(instruments.includes(i))}>{i}</button>)}
                </div>
                <div style={{ fontSize: "10px", color: "#8C829D", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginTop: "8px", marginBottom: "6px", fontWeight: 500 }}>World & Exotic</div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "5px" }}>
                  {EXOTIC_INSTRUMENTS.map(i => <button key={i} onClick={() => toggleInstrument(i)} style={s.amberTag(instruments.includes(i))}>{i}</button>)}
                </div>
              </div>

              {/* Language */}
              <div>
                <div style={s.paramLabel}>Language</div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "5px" }}>
                  {LANGUAGES.map(l => <button key={l} onClick={() => setLanguage(l)} style={s.tag(language === l)}>{l}</button>)}
                </div>
              </div>

              {/* Mode */}
              <div>
                <div style={s.paramLabel}>Mode</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {(["vocal", "instrumental"] as TrackMode[]).map(m => (
                    <button key={m} onClick={() => setTrackMode(m)} style={s.purpleTag(trackMode === m)}>
                      {m === "vocal" ? "\u{1F3A4} Vocal" : "\u{1F3B9} Instrumental"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vocal style */}
              {trackMode === "vocal" && (
                <div style={{ background: "#141418", border: "1px solid #2A1F3A", borderRadius: "8px", padding: "10px 12px" }}>
                  <div style={{ ...s.paramLabel, marginBottom: "8px" }}>Vocal Style</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "5px" }}>
                    {VOCAL_STYLES.map(vs => <button key={vs} onClick={() => setVocalStyle(vs)} style={s.tag(vocalStyle === vs)}>{vs}</button>)}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "11px", color: "#A855F7", fontStyle: "italic" }}>
                    → {vocalStyle}
                  </div>
                </div>
              )}
            </div>

            {/* Song Output */}
            <ResultPanel
              result={result}
              loading={loading}
              isStreaming={isStreaming}
              sunoPrompt={flow.sunoPrompt}
              sunoPromptLoading={flow.sunoPromptLoading}
              sunoPromptError={flow.sunoPromptError}
              viewMode={flow.viewMode}
            />
          </div>

          {/* Bottom bar */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", alignItems: "stretch" }}>
            <button
              onClick={() => {
                if (result) {
                  saveDraft({ title: compositionTitle, styles: activeStyles, outputType: vocalStyle, result, key, tempo, intensity, language, trackMode, instruments, mood: INTENSITY_LABELS[intensity], theme });
                } else if (flow.sunoPrompt) {
                  const sunoText = [flow.sunoPrompt.styleBlock, flow.sunoPrompt.lyricsBlock].filter(Boolean).join("\n\n").trim();
                  saveDraft({ title: compositionTitle, styles: activeStyles, outputType: "suno", result: sunoText, key, tempo, intensity, language, trackMode, instruments, mood: INTENSITY_LABELS[intensity], theme });
                }
              }}
              disabled={(!result && !flow.sunoPrompt) || !compositionTitle.trim()}
              title="Save to history"
              style={{
                padding: "10px 12px",
                background: (result || flow.sunoPrompt) ? "#2A1E06" : "transparent",
                border: `1px solid ${(result || flow.sunoPrompt) ? "#D4A840" : "#2A2A30"}`,
                boxShadow: (result || flow.sunoPrompt) ? "0 0 0 1px #D4A840" : "none",
                borderRadius: "6px",
                color: (result || flow.sunoPrompt) ? "#E8C060" : "#3A3830",
                fontSize: "12px", cursor: (result || flow.sunoPrompt) ? "pointer" : "not-allowed",
                letterSpacing: "0.04em", whiteSpace: "nowrap" as const,
                transition: "all 0.2s",
              }}
            >
              Save Draft
            </button>
            <button
              onClick={buildSunoPrompt}
              disabled={flow.sunoPromptLoading}
              style={{
                padding: "10px 14px",
                background: flow.sunoPromptLoading ? "#1A1A1F" : flow.sunoPromptError ? "#1A0808" : flow.sunoPrompt ? "#0A1020" : "#1A1020",
                border: `1px solid ${flow.sunoPromptLoading ? "#2A2A30" : flow.sunoPromptError ? "#7A3030" : flow.sunoPrompt ? "#6D28D9" : "#A855F7"}`,
                borderRadius: "6px",
                color: flow.sunoPromptLoading ? "#4A4840" : flow.sunoPromptError ? "#A05050" : flow.sunoPrompt ? "#A855F7" : "#A855F7",
                fontSize: "12px", fontWeight: 500,
                cursor: flow.sunoPromptLoading ? "not-allowed" : "pointer",
                letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s", whiteSpace: "nowrap" as const,
              }}
            >
              {flow.sunoPromptLoading ? "Building..." : flow.sunoPromptError ? "Suno Build Failed ✗" : flow.sunoPrompt ? "Suno Prompt Ready ✓" : "Build Suno Prompt"}
            </button>
            <button onClick={generate} disabled={loading || isStreaming} style={{ flex: 1, padding: "10px", background: loading || isStreaming ? "#1A1020" : "#A855F7", border: "none", borderRadius: "6px", color: loading || isStreaming ? "#8C829D" : "#0D0D0F", fontSize: "13px", fontWeight: 600, cursor: loading || isStreaming ? "not-allowed" : "pointer", letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", whiteSpace: "nowrap" as const }}>
              {loading || isStreaming ? "Generating..." : "Forge Track ↗"}
            </button>
          </div>
        </div>

        {/* VIDEO PANEL */}
        <VideoPanel
          key={`video-${resetKey}`}
          title={compositionTitle}
          style={activeStyles.join(" + ")}
          mood={INTENSITY_LABELS[intensity]}
          theme={theme}
          composition={panelComposition}
          compositionLoading={panelCompositionLoading}
          onResult={setVideoResult}
        />
      </div>
    </div>
  );
}
