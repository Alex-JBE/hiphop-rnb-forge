"use client";

import { useState, useRef, useCallback } from "react";
import CoverPanel from "@/components/CoverPanel";
import VideoPanel from "@/components/VideoPanel";
import Header from "@/components/Header";
import ResultPanel from "@/components/ResultPanel";
import DraftsPanel from "@/components/DraftsPanel";
import { useDrafts } from "@/lib/useDrafts";
import { exportTXT, exportPDF } from "@/lib/export";

// ─── Style Categories ─────────────────────────────────────────────────────────

const STYLE_CATEGORIES = [
  { label: "Classic Hip-Hop", variant: "purple" as const, styles: ["Boom Bap", "Jazz Rap", "East Coast", "Golden Era", "Hardcore Hip-Hop"] },
  { label: "Trap & Drill",    variant: "dark"   as const, styles: ["Trap", "Dark Trap", "Melodic Trap", "Drill", "UK Drill"] },
  { label: "R&B",             variant: "purple" as const, styles: ["Contemporary R&B", "90s R&B", "New Jack Swing", "Neo-Soul", "Alt-R&B"] },
  { label: "Conscious & Alt", variant: "dark"   as const, styles: ["Conscious Rap", "Alternative Hip-Hop", "Emo Rap", "Lo-Fi Hip-Hop", "Spoken Word"] },
  { label: "Club & Party",    variant: "purple" as const, styles: ["Crunk", "Bounce", "Hyphy", "Jersey Club", "Twerk"] },
  { label: "Experimental",    variant: "dark"   as const, styles: ["Cloud Rap", "Phonk", "Glitch Hop", "Vaporwave Hip-Hop", "Noise Rap"] },
  { label: "Southern",        variant: "purple" as const, styles: ["G-Funk", "West Coast", "Dirty South", "Memphis Rap", "Chopped & Screwed"] },
  { label: "Gospel & Soul",   variant: "dark"   as const, styles: ["Gospel Rap", "Soul Rap", "Trap Soul", "Inspirational", "Neo-Gospel"] },
  { label: "Latin & Caribbean", variant: "purple" as const, styles: ["Latin Trap", "Reggaeton Hip-Hop", "Dancehall Rap", "Afrobeats Rap", "Amapiano"] },
  { label: "Hybrid & Cross",  variant: "dark"   as const, styles: ["Pop Rap", "Rap Rock", "Country Rap", "K-Hip-Hop", "Grime"] },
];

// ─── Instruments ──────────────────────────────────────────────────────────────

const INSTRUMENTS = [
  "808 Bass", "Trap Kick", "Live Drums", "Hi-Hats", "Piano",
  "Rhodes", "Synth Pads", "Vinyl Sample", "Horns", "Strings",
  "Guitar Loop", "Vocal Chops", "Bass Guitar", "Organ",
];

const EXOTIC_INSTRUMENTS = [
  "Steel Drum", "Koto", "Oud", "Sitar", "Tabla",
  "Djembe", "Kalimba", "Marimba", "Balafon", "Pandeiro",
  "Mbira", "Kora", "Duduk", "Bansuri", "Gamelan", "Shamisen",
];

// ─── Languages ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  "English","Spanish","French","Portuguese","German","Italian","Russian",
  "Japanese","Korean","Chinese (Mandarin)","Chinese (Cantonese)","Arabic",
  "Hindi","Swahili","Yoruba","Amharic","Turkish","Persian","Polish","Dutch",
  "Swedish","Norwegian","Danish","Finnish","Greek","Hebrew","Romanian",
  "Hungarian","Czech","Ukrainian","Vietnamese","Thai","Indonesian","Malay",
  "Tagalog","Bengali","Urdu","Tamil","Telugu","Punjabi",
];

// ─── Presets ──────────────────────────────────────────────────────────────────

const MOOD_PRESETS = [
  { label: "Night",  icon: "🌃", style: "Trap Soul",      key: "F minor",  tempo: "Mid-Tempo Flow (85–100 BPM)", mood: "atmospheric, cinematic, late-night", theme: "city lights, solitude, reflection" },
  { label: "Summer", icon: "☀️", style: "West Coast",     key: "G major",  tempo: "Cruising Tempo (95–110 BPM)", mood: "sunny, energetic, carefree",         theme: "beaches, good times, freedom" },
  { label: "Sad",    icon: "💔", style: "Emo Rap",        key: "A minor",  tempo: "Slow Jam (65–75 BPM)",        mood: "melancholic, vulnerable, heartbroken", theme: "heartbreak, loss, loneliness" },
  { label: "Flex",   icon: "💪", style: "Trap",           key: "C minor",  tempo: "Trap Bounce (130–145 BPM)",   mood: "confident, hard-hitting, triumphant", theme: "success, hustle, rise from nothing" },
  { label: "Chill",  icon: "🌀", style: "Lo-Fi Hip-Hop",  key: "Bb major", tempo: "Lo-Fi Drift (60–80 BPM)",     mood: "relaxed, introspective, cozy",       theme: "rainy days, studying, nostalgia" },
  { label: "Club",   icon: "🔥", style: "Jersey Club",    key: "D minor",  tempo: "Drill Pace (140–160 BPM)",    mood: "energetic, euphoric, aggressive",    theme: "nightclub, dancing, energy" },
];

// ─── Keys & Tempos ────────────────────────────────────────────────────────────

const KEYS = ["A minor","D minor","F major","G minor","C major","Bb major","E minor","Ab major","F minor","C minor","G major","B minor"];

const TEMPOS = [
  { label: "Lo-Fi Drift",      bpm: "60–80 BPM" },
  { label: "Slow Jam",         bpm: "65–75 BPM" },
  { label: "Neo-Soul Groove",  bpm: "80–95 BPM" },
  { label: "Mid-Tempo Flow",   bpm: "85–100 BPM" },
  { label: "Boom Bap Beat",    bpm: "90–100 BPM" },
  { label: "Cruising Tempo",   bpm: "95–110 BPM" },
  { label: "Trap Bounce",      bpm: "130–145 BPM" },
  { label: "Drill Pace",       bpm: "140–160 BPM" },
];

const VOCAL_TONES = [
  "Rapping","Melodic Rap","Sung R&B","Auto-Tune",
  "Harmonized","Spoken Word","Whispering","Ad-Libs","Choir","Falsetto",
];

const INTENSITY_LABELS = ["","Intimate","Smooth","Energetic","Hard","Maximum"];

// ─── Pill helper ──────────────────────────────────────────────────────────────

function pill(label: string, active: boolean, onClick: () => void, variant: "purple" | "amber" | "dark" = "purple", size: "sm" | "xs" = "sm") {
  const colors = {
    purple: { active: { bg:"#3B1F6A", border:"#A855F7", color:"#C084FC" }, inactive: { bg:"#1A1020", border:"#2A1F3A", color:"#6B7280" } },
    amber:  { active: { bg:"#2A1A00", border:"#F59E0B", color:"#FCD34D" }, inactive: { bg:"#1A1020", border:"#2A1F3A", color:"#6B7280" } },
    dark:   { active: { bg:"#1E1E1E", border:"#9CA3AF", color:"#E5E7EB" }, inactive: { bg:"#1A1020", border:"#2A1F3A", color:"#6B7280" } },
  };
  const c = active ? colors[variant].active : colors[variant].inactive;
  return (
    <button key={label} onClick={onClick} style={{ padding: size==="xs" ? "3px 8px" : "4px 10px", background:c.bg, border:`1px solid ${c.border}`, borderRadius:"20px", color:c.color, fontSize:size==="xs" ? "10px" : "11px", cursor:"pointer", transition:"all 0.15s", fontFamily:"'DM Sans', sans-serif", whiteSpace:"nowrap" as const }}>
      {label}
    </button>
  );
}

// ─── Import Preset Row ────────────────────────────────────────────────────────

function ImportPresetRow({ onImport }: { onImport: (desc: string) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width:"100%", padding:"7px", background:"transparent", border:"1px solid var(--border)", borderRadius:"6px", color:"#6B7280", fontSize:"11px", cursor:"pointer", textAlign:"left" as const, marginBottom:"12px" }}>
      + Import Preset / Describe Track
    </button>
  );
  return (
    <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key==="Enter" && val.trim()) { onImport(val.trim()); setVal(""); setOpen(false); } }} placeholder="Describe a track or paste a preset..." autoFocus
        style={{ flex:1, background:"var(--bg-card)", border:"1px solid #3B1F6A", borderRadius:"6px", padding:"7px 8px", color:"var(--text-primary)", fontSize:"12px", fontFamily:"'DM Sans', sans-serif", outline:"none" }} />
      <button onClick={() => { if (val.trim()) { onImport(val.trim()); setVal(""); setOpen(false); } }} style={{ padding:"7px 10px", background:"#3B1F6A", border:"1px solid #A855F7", borderRadius:"6px", color:"#C084FC", fontSize:"11px", cursor:"pointer" }}>Go</button>
      <button onClick={() => setOpen(false)} style={{ padding:"7px 10px", background:"transparent", border:"1px solid var(--border)", borderRadius:"6px", color:"#6B7280", fontSize:"11px", cursor:"pointer" }}>✕</button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [title, setTitle]             = useState("");
  const [styles, setStyles]           = useState<string[]>(["Boom Bap"]);
  const [key, setKey]                 = useState("");
  const [tempo, setTempo]             = useState("");
  const [mood, setMood]               = useState("");
  const [theme, setTheme]             = useState("");
  const [language, setLanguage]       = useState("English");
  const [trackMode, setTrackMode]     = useState<"instrumental"|"vocals">("instrumental");
  const [vocalTone, setVocalTone]     = useState("");
  const [intensity, setIntensity]     = useState(3);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [exoticInstruments, setExoticInstruments] = useState<string[]>([]);
  const [notes, setNotes]             = useState("");

  const [result, setResult]           = useState("");
  const [isStreaming, setIsStreaming]  = useState(false);
  const [coverResult, setCoverResult] = useState("");
  const [videoResult, setVideoResult] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const [showDrafts, setShowDrafts]   = useState(false);
  const [combos, setCombos]           = useState<string[]>([]);
  const [combosLoading, setCombosLoading] = useState(false);
  const [resetKey, setResetKey]       = useState(0);

  const { drafts, saveDraft, deleteDraft, toggleStar } = useDrafts();

  // ── helpers ──
  function toggleStyle(s: string) {
    setStyles(prev => prev.includes(s) ? prev.filter(x => x!==s) : [...prev, s]);
  }
  function toggleInstrument(i: string) {
    setInstruments(prev => prev.includes(i) ? prev.filter(x => x!==i) : [...prev, i]);
  }
  function toggleExotic(i: string) {
    setExoticInstruments(prev => prev.includes(i) ? prev.filter(x => x!==i) : [...prev, i]);
  }

  function applyPreset(p: typeof MOOD_PRESETS[0]) {
    setStyles([p.style]); setKey(p.key); setTempo(p.tempo); setMood(p.mood); setTheme(p.theme);
  }

  function clearAll() {
    setTitle(""); setStyles(["Boom Bap"]); setKey(""); setTempo(""); setMood(""); setTheme("");
    setLanguage("English"); setTrackMode("instrumental"); setVocalTone(""); setIntensity(3);
    setInstruments([]); setExoticInstruments([]); setNotes(""); setResult("");
    setCoverResult(""); setVideoResult(""); setCombos([]);
    setResetKey(k => k+1);
  }

  // ── generate ──
  async function generate() {
    if (isStreaming) { abortRef.current?.abort(); setIsStreaming(false); return; }
    setResult(""); setCoverResult(""); setVideoResult(""); setIsStreaming(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, styles, key, tempo, mood, theme, language, trackMode, vocalTone, intensity, instruments: [...instruments, ...exoticInstruments], notes }),
        signal: abortRef.current.signal,
      });
      if (!res.ok || !res.body) { setIsStreaming(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setResult(acc);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") console.error(e);
    } finally {
      setIsStreaming(false);
    }
  }

  // ── combos ──
  async function fetchCombos() {
    if (styles.length === 0) return;
    setCombosLoading(true); setCombos([]);
    try {
      const res = await fetch("/api/combos", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ styles }) });
      const data = await res.json();
      setCombos(data.combos || []);
    } catch {}
    setCombosLoading(false);
  }

  // ── import preset ──
  async function importPreset(desc: string) {
    try {
      const res = await fetch("/api/import-preset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ description: desc }) });
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.styles?.length) setStyles(data.styles);
      if (data.key) setKey(data.key);
      if (data.tempo) setTempo(data.tempo);
      if (data.mood) setMood(data.mood);
      if (data.theme) setTheme(data.theme);
      if (data.vocalTone) { setTrackMode("vocals"); setVocalTone(data.vocalTone); }
      if (data.instruments?.length) setInstruments(data.instruments.filter((i: string) => INSTRUMENTS.includes(i)));
    } catch {}
  }

  // ── inspire ──
  async function inspireMe() {
    try {
      const res = await fetch("/api/inspire", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ genre: styles[0] || "Boom Bap" }) });
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.mood) setMood(data.mood);
      if (data.theme) setTheme(data.theme);
    } catch {}
  }

  // ── randomize ──
  async function randomize() {
    try {
      const res = await fetch("/api/random-theme", { method:"POST" });
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.style) setStyles([data.style]);
      if (data.styles?.length) setStyles(data.styles);
      if (data.key) setKey(data.key);
      if (data.tempo) setTempo(data.tempo);
      if (data.mood) setMood(data.mood);
      if (data.theme) setTheme(data.theme);
    } catch {}
  }

  // ── load draft ──
  const loadDraft = useCallback((draft: ReturnType<typeof useDrafts>["drafts"][0]) => {
    setTitle(draft.title || ""); setStyles(draft.styles || ["Boom Bap"]);
    setKey(draft.key || ""); setTempo(draft.tempo || ""); setMood(draft.mood || "");
    setTheme(draft.theme || ""); setLanguage(draft.language || "English");
    setTrackMode((draft.trackMode as "instrumental"|"vocals") || "instrumental");
    setVocalTone(draft.outputType || ""); setIntensity(draft.intensity ?? 3);
    setInstruments(draft.instruments || []); setResult(draft.result || "");
    setShowDrafts(false);
  }, []);

  const doSaveDraft = () => saveDraft({ title, styles, key, tempo, mood, theme, language, trackMode, outputType: vocalTone, intensity, instruments, result });

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"grid", gridTemplateColumns:"220px 1fr 1fr 220px", gridTemplateRows:"auto 1fr", height:"100vh", background:"var(--bg-primary)", color:"var(--text-primary)", fontFamily:"'DM Sans', sans-serif", overflow:"hidden" }}>

      {/* ── Header ── */}
      <div style={{ gridColumn:"1 / -1" }}>
        <Header
          title={title}
          composition={result}
          coverResult={coverResult}
          videoResult={videoResult}
          vocalTone={vocalTone}
          style={styles[0] || "Boom Bap"}
          language={language}
          onClear={clearAll}
        />
      </div>

      {/* ── COLUMN 1: Cover Panel ── */}
      <CoverPanel
        key={`cover-${resetKey}`}
        title={title}
        style={styles[0] || "Boom Bap"}
        mood={mood}
        theme={theme}
        composition={result}
        compositionLoading={isStreaming}
        onResult={setCoverResult}
      />

      {/* ── COLUMN 2: Genres + Combos + Drafts ── */}
      <div style={{ display:"flex", flexDirection:"column", borderRight:"1px solid var(--border)", overflow:"hidden" }}>
        {showDrafts && (
          <DraftsPanel
            drafts={drafts}
            onLoad={loadDraft}
            onDelete={deleteDraft}
            onStar={toggleStar}
          />
        )}
        <div style={{ flex:1, overflow:"auto", padding:"12px" }}>

          {/* Quick Presets */}
          <div style={{ marginBottom:"14px" }}>
            <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"6px" }}>Quick Presets</div>
            <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"5px" }}>
              {MOOD_PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)} style={{ display:"flex", alignItems:"center", gap:"4px", padding:"4px 8px", background:"#1A1020", border:"1px solid #2A1F3A", borderRadius:"6px", color:"#9CA3AF", fontSize:"11px", cursor:"pointer" }}>
                  <span>{p.icon}</span><span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Categories */}
          {STYLE_CATEGORIES.map(cat => (
            <div key={cat.label} style={{ marginBottom:"10px" }}>
              <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:cat.variant==="purple" ? "#A855F7" : "#9CA3AF", textTransform:"uppercase" as const, marginBottom:"5px" }}>{cat.label}</div>
              <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"4px" }}>
                {cat.styles.map(s => pill(s, styles.includes(s), () => toggleStyle(s), cat.variant==="purple" ? "purple" : "dark", "xs"))}
              </div>
            </div>
          ))}

          {/* Style Combos */}
          <div style={{ marginTop:"14px", borderTop:"1px solid var(--border)", paddingTop:"10px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
              <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const }}>Style Combos</div>
              <button onClick={fetchCombos} disabled={combosLoading || styles.length===0} style={{ fontSize:"10px", padding:"2px 8px", background:"transparent", border:"1px solid #3B1F6A", borderRadius:"4px", color:"#A855F7", cursor:"pointer" }}>
                {combosLoading ? "..." : "Generate"}
              </button>
            </div>
            {combos.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"4px" }}>
                {combos.map(c => (
                  <button key={c} onClick={() => setStyles(c.split(" × "))} style={{ fontSize:"10px", padding:"3px 8px", background:"#1A1020", border:"1px solid #3B1F6A", borderRadius:"12px", color:"#C084FC", cursor:"pointer" }}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding:"10px 12px", borderTop:"1px solid var(--border)", display:"flex", gap:"5px" }}>
          <button onClick={() => setShowDrafts(v => !v)} style={{ flex:1, padding:"7px", background:"transparent", border:"1px solid var(--border)", borderRadius:"6px", color:"#9CA3AF", fontSize:"11px", cursor:"pointer" }}>
            {showDrafts ? "Hide Drafts" : `Drafts (${drafts.length})`}
          </button>
          <button onClick={randomize} style={{ padding:"7px 10px", background:"transparent", border:"1px solid #3B1F6A", borderRadius:"6px", color:"#A855F7", fontSize:"11px", cursor:"pointer" }}>
            ⚡ Random
          </button>
        </div>
      </div>

      {/* ── COLUMN 3: Controls + Result ── */}
      <div style={{ display:"flex", flexDirection:"column", borderRight:"1px solid var(--border)", overflow:"hidden" }}>
        <div style={{ flex:1, overflow:"auto", padding:"16px" }}>

          {/* Title */}
          <div style={{ marginBottom:"12px" }}>
            <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"4px" }}>Track Title</div>
            <div style={{ display:"flex", gap:"6px" }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter track title..." style={{ flex:1, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"8px 10px", color:"var(--text-primary)", fontSize:"13px", fontFamily:"'DM Sans', sans-serif", outline:"none" }} />
              <button onClick={inspireMe} style={{ padding:"8px 12px", background:"transparent", border:"1px solid #3B1F6A", borderRadius:"6px", color:"#A855F7", fontSize:"11px", cursor:"pointer", whiteSpace:"nowrap" as const }}>✦ Inspire</button>
            </div>
          </div>

          <ImportPresetRow onImport={importPreset} />

          {/* Key & Tempo */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
            <div>
              <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"4px" }}>Key</div>
              <select value={key} onChange={e => setKey(e.target.value)} style={{ width:"100%", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"7px 8px", color:key ? "var(--text-primary)" : "#6B7280", fontSize:"12px", fontFamily:"'DM Sans', sans-serif", outline:"none" }}>
                <option value="">Any Key</option>
                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"4px" }}>Tempo</div>
              <select value={tempo} onChange={e => setTempo(e.target.value)} style={{ width:"100%", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"7px 8px", color:tempo ? "var(--text-primary)" : "#6B7280", fontSize:"12px", fontFamily:"'DM Sans', sans-serif", outline:"none" }}>
                <option value="">Any Tempo</option>
                {TEMPOS.map(t => <option key={t.label} value={`${t.label} (${t.bpm})`}>{t.label} ({t.bpm})</option>)}
              </select>
            </div>
          </div>

          {/* Mood & Theme */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
            <div>
              <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"4px" }}>Mood</div>
              <input value={mood} onChange={e => setMood(e.target.value)} placeholder="e.g. melancholic, dark..." style={{ width:"100%", boxSizing:"border-box" as const, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"7px 8px", color:"var(--text-primary)", fontSize:"12px", fontFamily:"'DM Sans', sans-serif", outline:"none" }} />
            </div>
            <div>
              <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"4px" }}>Theme</div>
              <input value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g. hustle, love, streets..." style={{ width:"100%", boxSizing:"border-box" as const, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"7px 8px", color:"var(--text-primary)", fontSize:"12px", fontFamily:"'DM Sans', sans-serif", outline:"none" }} />
            </div>
          </div>

          {/* Intensity */}
          <div style={{ marginBottom:"12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
              <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const }}>Intensity</div>
              <div style={{ fontSize:"11px", color:"#A855F7" }}>{INTENSITY_LABELS[intensity]}</div>
            </div>
            <input type="range" min={1} max={5} value={intensity} onChange={e => setIntensity(Number(e.target.value))} style={{ width:"100%", accentColor:"#A855F7" }} />
          </div>

          {/* Track Mode */}
          <div style={{ marginBottom:"12px" }}>
            <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"6px" }}>Track Mode</div>
            <div style={{ display:"flex", gap:"6px" }}>
              {(["instrumental","vocals"] as const).map(m => (
                <button key={m} onClick={() => setTrackMode(m)} style={{ flex:1, padding:"7px", background:trackMode===m ? "#3B1F6A" : "var(--bg-card)", border:`1px solid ${trackMode===m ? "#A855F7" : "var(--border)"}`, borderRadius:"6px", color:trackMode===m ? "#C084FC" : "#6B7280", fontSize:"11px", cursor:"pointer" }}>
                  {m==="instrumental" ? "Instrumental" : "With Vocals"}
                </button>
              ))}
            </div>
          </div>

          {/* Vocal Tone */}
          {trackMode==="vocals" && (
            <div style={{ marginBottom:"12px" }}>
              <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"6px" }}>Vocal Style</div>
              <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"4px" }}>
                {VOCAL_TONES.map(vt => pill(vt, vocalTone===vt, () => setVocalTone(vt===vocalTone ? "" : vt), "purple", "xs"))}
              </div>
            </div>
          )}

          {/* Language */}
          <div style={{ marginBottom:"12px" }}>
            <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"4px" }}>Language</div>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width:"100%", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"7px 8px", color:"var(--text-primary)", fontSize:"12px", fontFamily:"'DM Sans', sans-serif", outline:"none" }}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Instruments */}
          <div style={{ marginBottom:"10px" }}>
            <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"6px" }}>Instruments</div>
            <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"4px" }}>
              {INSTRUMENTS.map(i => pill(i, instruments.includes(i), () => toggleInstrument(i), "purple", "xs"))}
            </div>
          </div>

          {/* World Instruments */}
          <div style={{ marginBottom:"12px" }}>
            <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"6px" }}>World Instruments</div>
            <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"4px" }}>
              {EXOTIC_INSTRUMENTS.map(i => pill(i, exoticInstruments.includes(i), () => toggleExotic(i), "amber", "xs"))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom:"12px" }}>
            <div style={{ fontSize:"9px", letterSpacing:"0.12em", color:"#6B7280", textTransform:"uppercase" as const, marginBottom:"4px" }}>Additional Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional directions..." rows={2} style={{ width:"100%", boxSizing:"border-box" as const, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"8px 10px", color:"var(--text-primary)", fontSize:"12px", fontFamily:"'DM Sans', sans-serif", outline:"none", resize:"vertical" as const }} />
          </div>

          {/* Result */}
          {result && (
            <ResultPanel result={result} isStreaming={isStreaming} />
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)", display:"flex", gap:"6px" }}>
          {result && !isStreaming && (
            <>
              <button onClick={doSaveDraft} style={{ padding:"10px 12px", background:"transparent", border:"1px solid #3B1F6A", borderRadius:"6px", color:"#A855F7", fontSize:"11px", cursor:"pointer" }}>Save ★</button>
              <button onClick={() => exportTXT(title || "hiphop-track", result)} style={{ padding:"10px 12px", background:"transparent", border:"1px solid #888578", borderRadius:"6px", color:"#F0EDE6", fontSize:"11px", cursor:"pointer" }}>TXT ↓</button>
              <button onClick={() => exportPDF(title || "hiphop-track", result)} style={{ padding:"10px 12px", background:"transparent", border:"1px solid #888578", borderRadius:"6px", color:"#F0EDE6", fontSize:"11px", cursor:"pointer" }}>PDF ↓</button>
            </>
          )}
          <button onClick={clearAll} style={{ padding:"10px 14px", background:"transparent", border:"1px solid var(--border)", borderRadius:"6px", color:"#6B7280", fontSize:"11px", cursor:"pointer" }}>Clear</button>
          <button onClick={generate} style={{ flex:1, padding:"10px", background:isStreaming ? "#1A1020" : "var(--border-purple)", border:`1px solid ${isStreaming ? "#6D28D9" : "#A855F7"}`, borderRadius:"6px", color:"#C084FC", fontSize:"12px", letterSpacing:"0.06em", textTransform:"uppercase" as const, cursor:"pointer", fontFamily:"'DM Sans', sans-serif", transition:"all 0.2s" }}>
            {isStreaming ? "■ Stop" : "Forge Track"}
          </button>
        </div>
      </div>

      {/* ── COLUMN 4: Video Panel ── */}
      <VideoPanel
        key={`video-${resetKey}`}
        title={title}
        style={styles[0] || "Boom Bap"}
        mood={mood}
        theme={theme}
        composition={result}
        compositionLoading={isStreaming}
        onResult={setVideoResult}
      />
    </div>
  );
}
