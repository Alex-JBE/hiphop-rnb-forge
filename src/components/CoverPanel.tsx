"use client";

import { useState } from "react";
import { exportTXT } from "@/lib/export";

interface CoverPanelProps {
  title: string;
  style: string;
  mood: string;
  theme: string;
  composition: string;
  compositionLoading: boolean;
  onResult: (result: string) => void;
}

const FORMATS = [
  { key: "CD_COVER", label: "CD / Album", ratio: "1:1", icon: "◉" },
  { key: "YOUTUBE", label: "YouTube", ratio: "16:9", icon: "▶" },
  { key: "TIKTOK", label: "TikTok / Reels", ratio: "9:16", icon: "↑" },
];

const IMAGE_SERVICES = [
  { id: "mage",     label: "Mage.space",   url: "https://www.mage.space/" },
  { id: "magnific", label: "Magnific",      url: "https://www.magnific.com/" },
  { id: "recraft",  label: "Recraft",       url: "https://www.recraft.ai/" },
  { id: "flow",     label: "Google Flow",   url: "https://flow.google.com/" },
];

function parseCoverResult(text: string) {
  const result: Record<string, string> = {};
  for (const format of FORMATS) {
    const regex = new RegExp(`${format.key}:\\s*([\\s\\S]*?)(?=(?:CD_COVER:|YOUTUBE:|TIKTOK:|$))`, "i");
    const match = text.match(regex);
    if (match) result[format.key] = match[1].trim();
  }
  return result;
}

function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

export default function CoverPanel({ title, style, mood, theme, composition, compositionLoading, onResult }: CoverPanelProps) {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeService, setActiveService] = useState("mage");

  const isDisabled = loading || !composition || compositionLoading;

  async function generate() {
    setLoading(true);
    setResult("");
    onResult("");
    try {
      const res = await fetch("/api/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, style, mood, theme, composition }),
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
    } catch {
      setLoading(false);
    }
  }

  function copy(text: string, key: string) {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function openInService(text: string, formatKey: string) {
    const service = IMAGE_SERVICES.find(s => s.id === activeService);
    if (!service) return;
    copyToClipboard(text);
    setCopied(`open_${formatKey}`);
    setTimeout(() => setCopied(null), 2000);
    window.open(service.url, "_blank");
  }

  function downloadTXT() {
    const parsed = parseCoverResult(result);
    const text = FORMATS
      .filter(f => parsed[f.key])
      .map(f => `${f.label} (${f.ratio})\n${"─".repeat(40)}\n${parsed[f.key]}`)
      .join("\n\n");
    exportTXT(`${title || "cover-prompts"}-cover`, text);
  }

  const parsed = parseCoverResult(result);
  const currentService = IMAGE_SERVICES.find(s => s.id === activeService);

  return (
    <div style={{
      background: "var(--bg-panel)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
    }}>
      <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "var(--purple-dim)", textTransform: (isDisabled ? "none" : "uppercase") as "none" | "uppercase", marginBottom: "4px" }}>Cover Art</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", color: "var(--text-primary)" }}>Image Prompts</div>
      </div>

      {/* Format list */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {FORMATS.map((f) => (
            <div key={f.key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 10px", background: "var(--bg-card)",
              border: "1px solid var(--border)", borderRadius: "6px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "var(--purple)", fontSize: "12px" }}>{f.icon}</span>
                <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>{f.label}</span>
              </div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{f.ratio}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Service selector */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: "10px", color: "#6A6860", letterSpacing: "0.1em", textTransform: (isDisabled ? "none" : "uppercase") as "none" | "uppercase", marginBottom: "6px", fontWeight: 500 }}>
          Open prompts in
        </div>
        <div style={{ display: "flex", gap: "5px" }}>
          {IMAGE_SERVICES.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveService(s.id)}
              style={{
                flex: 1, fontSize: "11px", padding: "5px 4px",
                borderRadius: "6px",
                border: `1px solid ${activeService === s.id ? "#A855F7" : "#2A2A30"}`,
                background: activeService === s.id ? "#1A1020" : "#1A1A1F",
                color: activeService === s.id ? "#A855F7" : "#888578",
                cursor: "pointer", transition: "all 0.15s",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {loading && (
          <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", paddingTop: "24px" }}>
            <span style={{ color: "var(--purple)" }}>●</span> Generating prompts...
          </div>
        )}
        {!loading && !result && (
          <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", paddingTop: "24px", fontStyle: "italic" }}>
            {compositionLoading ? "Waiting for composition..." : !composition ? "Generate a composition first" : "Ready to generate cover prompts"}
          </div>
        )}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FORMATS.map((f) => parsed[f.key] ? (
              <div key={f.key} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                  <span style={{ fontSize: "10px", color: "var(--purple)", letterSpacing: "0.08em", textTransform: (isDisabled ? "none" : "uppercase") as "none" | "uppercase" }}>{f.label} · {f.ratio}</span>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={() => copy(parsed[f.key], f.key)}
                      style={{ fontSize: "10px", color: copied === f.key ? "var(--purple)" : "#F0EDE6", background: "transparent", border: "1px solid #888578", borderRadius: "4px", padding: "2px 8px", cursor: "pointer" }}
                    >
                      {copied === f.key ? "Copied ✓" : "Copy"}
                    </button>
                    <button
                      onClick={() => openInService(parsed[f.key], f.key)}
                      style={{
                        fontSize: "10px",
                        color: copied === `open_${f.key}` ? "#5DCAA5" : "#A855F7",
                        background: copied === `open_${f.key}` ? "#0F3028" : "#1A1020",
                        border: `1px solid ${copied === `open_${f.key}` ? "#1D9E75" : "#A855F7"}`,
                        borderRadius: "4px", padding: "2px 8px", cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {copied === `open_${f.key}` ? "Copied & Opening ✓" : `Open in ${currentService?.label} ↗`}
                    </button>
                  </div>
                </div>
                <div style={{ padding: "10px 12px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6", fontFamily: "'DM Mono', monospace" }}>
                  {parsed[f.key]}
                </div>
              </div>
            ) : null)}
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
          {loading ? "Generating..." : compositionLoading ? "Waiting..." : !composition ? "Generate composition first" : "Generate Cover Prompts ↗"}
        </button>
      </div>
    </div>
  );
}
