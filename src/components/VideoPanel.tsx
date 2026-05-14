"use client";

import { useState } from "react";
import { exportTXT } from "@/lib/export";

interface VideoPanelProps {
  title: string;
  style: string;
  mood: string;
  theme: string;
  composition: string;
  compositionLoading: boolean;
  onResult: (result: string) => void;
}

const CLIP_LENGTHS = ["5", "8", "10", "15"];

function parseVideoResult(text: string) {
  const clips: { id: string; prompt: string }[] = [];
  const regex = /CLIP_(\d+):\s*([\s\S]*?)(?=CLIP_\d+:|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    clips.push({ id: match[1], prompt: match[2].trim() });
  }
  return clips;
}

function parseSection(text: string, key: string): string {
  const regex = new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|CLIP_\\d+:|$)`);
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function calcClips(duration: string, clipLen: number): number {
  if (!duration) return 0;
  const parts = duration.split(":");
  let totalSec = 0;
  if (parts.length === 2) totalSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  else totalSec = parseInt(duration) || 0;
  return totalSec > 0 ? Math.ceil(totalSec / clipLen) : 0;
}

type SegMode = "split_by_duration" | "split_by_scene_count" | "keep_full_length";

export default function VideoPanel({ title, style, mood, theme, composition, compositionLoading, onResult }: VideoPanelProps) {
  const [duration, setDuration] = useState("");
  const [clipLength, setClipLength] = useState("10");
  const [sceneCount, setSceneCount] = useState("12");
  const [segMode, setSegMode] = useState<SegMode>("split_by_duration");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showBibles, setShowBibles] = useState(false);

  const isDisabled = loading || !composition || compositionLoading;
  const previewClips = segMode === "split_by_duration" && duration
    ? calcClips(duration, parseInt(clipLength))
    : null;

  const characterBible = parseSection(result, "CHARACTER_BIBLE");
  const worldBible = parseSection(result, "WORLD_BIBLE");
  const storyArc = parseSection(result, "STORY_ARC");
  const clips = parseVideoResult(result);

  async function generate() {
    setLoading(true);
    setResult("");
    onResult("");
    setShowBibles(false);
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, style, mood, theme, composition,
          duration,
          clipLength,
          sceneCount,
          segmentationMode: segMode,
        }),
      });
      if (!res.ok || !res.body) { setLoading(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setResult(acc);
        onResult(acc);
      }
      setShowBibles(true);
    } catch {
      setLoading(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function copyAll() {
    const text = clips.map((c) => `CLIP ${c.id}:\n${c.prompt}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied("all");
    setTimeout(() => setCopied(null), 1500);
  }

  function downloadTXT() {
    const header = `VIDEO SCRIPT — ${title || "Untitled"}\nDuration: ${duration} | Clips: ${clips.length}\n${"─".repeat(40)}\n\n`;
    const bibles = characterBible ? `CHARACTER BIBLE:\n${characterBible}\n\nWORLD BIBLE:\n${worldBible}\n\nSTORY ARC:\n${storyArc}\n\n${"─".repeat(40)}\n\n` : "";
    const text = header + bibles + clips.map((c) => `CLIP ${c.id.padStart(2, "0")}:\n${c.prompt}`).join("\n\n");
    exportTXT(`${title || "video-script"}-video`, text);
  }

  const segBtnStyle = (active: boolean) => ({
    flex: 1,
    padding: "5px 4px",
    fontSize: "10px",
    background: active ? "var(--border-purple)" : "var(--bg-card)",
    border: `1px solid ${active ? "var(--purple-dim)" : "var(--border)"}`,
    borderRadius: "5px",
    color: active ? "var(--purple-light)" : "var(--text-muted)",
    cursor: "pointer" as const,
    letterSpacing: "0.02em",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
    textAlign: "center" as const,
  });

  return (
    <div style={{
      background: "var(--bg-panel)",
      borderLeft: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
    }}>
      <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "var(--purple-dim)", textTransform: "uppercase", marginBottom: "4px" }}>Video Script</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", color: "var(--text-primary)" }}>Scene Prompts</div>
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>

        {/* Duration */}
        <div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Track Duration</div>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="3:30"
            style={{
              width: "100%", padding: "7px 10px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)", borderRadius: "6px",
              color: "var(--text-primary)",
              fontSize: "13px", fontFamily: "'DM Mono', monospace", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Segmentation mode */}
        <div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Mode</div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => setSegMode("split_by_duration")} style={segBtnStyle(segMode === "split_by_duration")}>By Duration</button>
            <button onClick={() => setSegMode("split_by_scene_count")} style={segBtnStyle(segMode === "split_by_scene_count")}>By Scenes</button>
            <button onClick={() => setSegMode("keep_full_length")} style={segBtnStyle(segMode === "keep_full_length")}>Full Length</button>
          </div>
        </div>

        {/* Clip length — only for split_by_duration */}
        {segMode === "split_by_duration" && (
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Clip Length</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {CLIP_LENGTHS.map((l) => (
                <button key={l} onClick={() => setClipLength(l)} style={{
                  flex: 1, padding: "6px",
                  background: clipLength === l ? "var(--border-purple)" : "var(--bg-card)",
                  border: `1px solid ${clipLength === l ? "var(--purple-dim)" : "var(--border)"}`,
                  borderRadius: "6px",
                  color: clipLength === l ? "var(--purple-light)" : "var(--text-muted)",
                  fontSize: "12px", cursor: "pointer", fontFamily: "'DM Mono', monospace",
                }}>
                  {l}s
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scene count — only for split_by_scene_count */}
        {segMode === "split_by_scene_count" && (
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Number of Scenes</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["6", "8", "10", "12", "16"].map((n) => (
                <button key={n} onClick={() => setSceneCount(n)} style={{
                  flex: 1, padding: "6px",
                  background: sceneCount === n ? "var(--border-purple)" : "var(--bg-card)",
                  border: `1px solid ${sceneCount === n ? "var(--purple-dim)" : "var(--border)"}`,
                  borderRadius: "6px",
                  color: sceneCount === n ? "var(--purple-light)" : "var(--text-muted)",
                  fontSize: "12px", cursor: "pointer", fontFamily: "'DM Mono', monospace",
                }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {previewClips !== null && previewClips > 0 && !result && (
          <div style={{ padding: "7px 10px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "11px", color: "var(--purple-dim)" }}>
            {duration} ÷ {clipLength}s = <span style={{ color: "var(--purple)", fontWeight: 500 }}>{previewClips} clips</span>
          </div>
        )}
      </div>

      {/* Bibles — shown after generation */}
      {showBibles && characterBible && (
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setShowBibles(b => !b)}
            style={{
              width: "100%", padding: "8px 16px",
              background: "transparent", border: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              color: "var(--purple-dim)", fontSize: "10px",
              letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <span>Character · World · Arc</span>
            <span>{showBibles ? "▴" : "▾"}</span>
          </button>
          {showBibles && (
            <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Character Bible", text: characterBible },
                { label: "World Bible", text: worldBible },
                { label: "Story Arc", text: storyArc },
              ].map(({ label, text }) => text ? (
                <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                  <div style={{ padding: "5px 10px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: "9px", color: "var(--purple)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ padding: "8px 10px", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                    {text}
                  </div>
                </div>
              ) : null)}
            </div>
          )}
        </div>
      )}

      {/* Clips count */}
      {clips.length > 0 && (
        <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>Duration</div>
            <div style={{ fontSize: "13px", color: "var(--purple)", fontFamily: "'DM Mono', monospace" }}>{duration || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>Clips</div>
            <div style={{ fontSize: "13px", color: "var(--purple)", fontFamily: "'DM Mono', monospace" }}>{clips.length}</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>Mode</div>
            <div style={{ fontSize: "11px", color: "var(--purple)", fontFamily: "'DM Mono', monospace" }}>
              {segMode === "split_by_duration" ? `${clipLength}s` : segMode === "split_by_scene_count" ? `${sceneCount} sc` : "full"}
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button onClick={copyAll} style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: copied === "all" ? "var(--purple)" : "#F0EDE6", fontSize: "11px", cursor: "pointer" }}>
              {copied === "all" ? "Copied ✓" : "Copy All"}
            </button>
          </div>
        </div>
      )}

      {/* Clips list */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {loading && (
          <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", paddingTop: "24px" }}>
            <span style={{ color: "var(--purple)" }}>●</span> Writing scene prompts...
          </div>
        )}
        {!loading && !result && (
          <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", paddingTop: "24px", fontStyle: "italic" }}>
            {compositionLoading ? "Waiting for composition..." : !composition ? "Generate a composition first" : "Set duration, then generate"}
          </div>
        )}
        {clips.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {clips.map((clip) => (
              <div key={clip.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "10px", color: "var(--purple)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}>
                    CLIP {clip.id.padStart(2, "0")}
                  </span>
                  <button onClick={() => copy(clip.prompt, clip.id)} style={{ fontSize: "10px", color: copied === clip.id ? "var(--purple)" : "#F0EDE6", background: "transparent", border: "1px solid #888578", borderRadius: "4px", padding: "2px 6px", cursor: "pointer" }}>
                    {copied === clip.id ? "✓" : "Copy"}
                  </button>
                </div>
                <div style={{ padding: "8px 10px", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {clip.prompt}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "6px" }}>
        {result && (
          <button onClick={downloadTXT} style={{ padding: "10px 12px", background: "transparent", border: "1px solid #888578", borderRadius: "6px", color: "#F0EDE6", fontSize: "11px", cursor: "pointer", letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif" }}>
            TXT ↓
          </button>
        )}
        <button
          onClick={generate}
          disabled={isDisabled}
          style={{
            flex: 1, padding: "10px",
            background: isDisabled ? "var(--bg-card)" : "var(--border-purple)",
            border: "1px solid var(--purple-dim)", borderRadius: "6px",
            color: isDisabled ? "var(--text-muted)" : "var(--purple-light)",
            fontSize: "12px", letterSpacing: "0.06em", textTransform: (isDisabled ? "none" : "uppercase") as "none" | "uppercase",
            cursor: isDisabled ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
          }}
        >
          {loading ? "Generating..." : compositionLoading ? "Waiting..." : !composition ? "Generate composition first" : "Generate Video Script ↗"}
        </button>
      </div>
    </div>
  );
}