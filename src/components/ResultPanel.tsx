"use client";

import { useState, useEffect } from "react";
import { exportTXT } from "@/lib/export";

type ViewMode = "composition" | "suno";
type SunoPrompt = { styleBlock: string; lyricsBlock: string; updatedAt: number; title: string };

interface ResultPanelProps {
  result: string;
  isStreaming: boolean;
  loading?: boolean;
  sunoPrompt?: SunoPrompt | null;
  sunoPromptLoading?: boolean;
  sunoPromptError?: boolean;
  viewMode?: ViewMode;
}

function extractSections(text: string) {
  const sections: Record<string, string> = {};
  const sectionOrder: string[] = [];
  const lines = text.split("\n");
  let current = "composition";
  let buffer: string[] = [];
  sectionOrder.push("composition");

  for (const line of lines) {
    const trimmed = line.trim();
    const isLyrics = /\[LYRICS/i.test(trimmed) || /^LYRICS[\s\-:]/i.test(trimmed);
    const isImprov = /\[IMPROVISATION/i.test(trimmed) || /^IMPROVISATION[\s\-:]/i.test(trimmed);
    const isArrangement = /\[ARRANGEMENT/i.test(trimmed) || /^ARRANGEMENT[\s\-:]/i.test(trimmed);

    if (isLyrics) {
      sections[current] = buffer.join("\n").trim();
      buffer = []; current = "lyrics";
      if (!sectionOrder.includes("lyrics")) sectionOrder.push("lyrics");
      continue;
    }
    if (isImprov) {
      sections[current] = buffer.join("\n").trim();
      buffer = []; current = "improv";
      if (!sectionOrder.includes("improv")) sectionOrder.push("improv");
      continue;
    }
    if (isArrangement) {
      sections[current] = buffer.join("\n").trim();
      buffer = []; current = "arrangement";
      if (!sectionOrder.includes("arrangement")) sectionOrder.push("arrangement");
      continue;
    }
    buffer.push(line);
  }
  sections[current] = buffer.join("\n").trim();
  return { sections, sectionOrder };
}

const SECTION_LABELS: Record<string, string> = {
  composition: "Composition",
  lyrics: "Lyrics",
  improv: "Improvisation",
  arrangement: "Arrangement",
};

function SunoCopyBlock({ label, content, monospace }: { label: string; content: string; monospace?: boolean }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    try { navigator.clipboard.writeText(content); }
    catch {
      const el = document.createElement("textarea");
      el.value = content; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--purple)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        <button onClick={handleCopy} style={{ fontSize: "11px", color: copied ? "var(--purple)" : "#F0EDE6", background: "transparent", border: "1px solid #888578", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div style={{ padding: "14px", background: "var(--bg-card)" }}>
        {monospace
          ? <pre style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.7", whiteSpace: "pre-wrap", fontFamily: "'DM Mono', monospace", margin: 0 }}>{content}</pre>
          : <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7", margin: 0 }}>{content}</p>
        }
      </div>
    </div>
  );
}

function SectionBlock({
  label,
  sectionKey,
  content,
  onRefine,
}: {
  label: string;
  sectionKey: string;
  content: string;
  onRefine: (key: string, newContent: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => { setLocalContent(content); }, [content]);

  async function handleRefine() {
    if (!instruction.trim()) return;
    setRefining(true);
    setLocalContent("");
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: label, content, instruction }),
      });
      if (!res.ok || !res.body) { setRefining(false); setLocalContent(content); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setLocalContent(acc);
      }
      onRefine(sectionKey, acc);
      setInstruction("");
      setShowRefine(false);
    } catch {
      setLocalContent(content);
    } finally {
      setRefining(false);
    }
  }

  function handleCopy() {
  try {
    navigator.clipboard.writeText(localContent);
  } catch {
    const el = document.createElement("textarea");
    el.value = localContent;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
  setCopied(true);
  setTimeout(() => setCopied(false), 1500);
}

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--purple)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setShowRefine(!showRefine)} style={{
            fontSize: "11px",
            color: showRefine ? "var(--purple)" : "var(--text-muted)",
            background: showRefine ? "#1A1020" : "transparent",
            border: `1px solid ${showRefine ? "var(--purple-dim)" : "var(--border)"}`,
            borderRadius: "4px", padding: "3px 8px", cursor: "pointer", transition: "all 0.15s",
          }}>Refine</button>
          <button onClick={handleCopy} style={{
            fontSize: "11px", color: copied ? "var(--purple)" : "#F0EDE6",
            background: "transparent", border: "1px solid #888578",
            borderRadius: "4px", padding: "3px 8px", cursor: "pointer",
          }}>{copied ? "Copied ✓" : "Copy"}</button>
        </div>
      </div>

      {showRefine && (
        <div style={{ padding: "10px 14px", background: "#110E05", borderBottom: "1px solid var(--border)", display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleRefine()}
            placeholder="e.g. make it darker, rewrite in Coltrane style..."
            disabled={refining}
            style={{
              flex: 1, padding: "6px 10px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "6px", color: "var(--text-primary)",
              fontSize: "12px", outline: "none", fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button onClick={handleRefine} disabled={refining || !instruction.trim()} style={{
            padding: "6px 14px",
            background: refining || !instruction.trim() ? "var(--bg-card)" : "var(--purple)",
            border: "none", borderRadius: "6px",
            color: refining || !instruction.trim() ? "var(--text-muted)" : "#0D0D0F",
            fontSize: "12px", fontWeight: 600,
            cursor: refining || !instruction.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
          }}>{refining ? "Refining..." : "Apply ↗"}</button>
        </div>
      )}

      <div style={{ padding: "14px", background: "var(--bg-card)" }}>
        {localContent.split("\n").map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "---" || trimmed === "***" || trimmed === "#")
            return <div key={i} style={{ height: "6px" }} />;
          if (/^\[.+\]$/.test(trimmed)) return (
            <div key={i} style={{ fontSize: "10px", fontWeight: 500, color: "var(--purple)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "12px", marginBottom: "4px" }}>
              {trimmed.replace(/[\[\]]/g, "")}
            </div>
          );
          if (/^(TITLE|STYLE|FEEL|KEY|FORM):/.test(trimmed)) return (
            <p key={i} style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px", fontFamily: "'DM Mono', monospace" }}>{trimmed}</p>
          );
          if (trimmed.startsWith("#") || trimmed.startsWith("**")) return (
            <p key={i} style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginTop: "8px", marginBottom: "2px" }}>
              {trimmed.replace(/^#+\s/, "").replace(/\*\*/g, "")}
            </p>
          );
          return (
            <p key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
              {trimmed.replace(/^[-*]\s/, "").replace(/\*\*/g, "")}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function ResultPanel({ result, loading, isStreaming, sunoPrompt, sunoPromptLoading, sunoPromptError, viewMode = "composition" }: ResultPanelProps) {
  const title = result.split("\n").find(l => /^#?\s*TITLE:/i.test(l))?.replace(/^#?\s*TITLE:/i, "").trim() || "hiphop-rnb-forge";
  const [refinedSections, setRefinedSections] = useState<Record<string, string>>({});

  useEffect(() => { if (!result) setRefinedSections({}); }, [result]);

  function handleRefine(key: string, newContent: string) {
    setRefinedSections(prev => ({ ...prev, [key]: newContent }));
  }

  const rootStyle: React.CSSProperties = {
    height: "100%",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
  };

  if (viewMode === "suno") {
    if (sunoPromptLoading) {
      return (
        <div style={rootStyle}>
          <div style={{ margin: "16px", padding: "32px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              <span style={{ color: "var(--purple)" }}>●</span><span>●</span><span>●</span>
              <span style={{ marginLeft: "8px" }}>Building Suno prompt...</span>
            </div>
          </div>
        </div>
      );
    }
    if (sunoPromptError || !sunoPrompt) {
      return (
        <div style={rootStyle}>
          <div style={{ margin: "16px", padding: "32px", background: "var(--bg-card)", border: "1px solid #7A3030", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "120px" }}>
            <p style={{ color: "#A05050", fontSize: "13px", fontStyle: "italic" }}>Failed to build Suno prompt — try again.</p>
          </div>
        </div>
      );
    }
    return (
      <div style={rootStyle}>
        <div style={{ padding: "16px" }}>
          {sunoPrompt.title && (
            <div style={{ padding: "10px 14px", background: "#1A1020", border: "1px solid #3A2A50", borderRadius: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "10px", color: "var(--purple)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginRight: "10px" }}>Title</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{sunoPrompt.title}</span>
            </div>
          )}
          <SunoCopyBlock label="Style of Music" content={sunoPrompt.styleBlock} />
          {sunoPrompt.lyricsBlock
            ? <SunoCopyBlock label="Lyrics" content={sunoPrompt.lyricsBlock} monospace />
            : <div style={{ padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No lyrics in response.</div>
          }
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={rootStyle}>
        <div style={{ margin: "16px", padding: "32px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            <span style={{ color: "var(--purple)" }}>●</span>
            <span>●</span>
            <span>●</span>
            <span style={{ marginLeft: "8px" }}>Generating...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={rootStyle}>
        <div style={{ margin: "16px", padding: "32px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "120px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>Your composition will appear here...</p>
        </div>
      </div>
    );
  }

  if (isStreaming) {
    return (
      <div style={rootStyle}>
        <div style={{ padding: "16px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "16px",
            flex: 1,
            overflow: "auto",
          }}>
            <pre style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: "1.7",
              whiteSpace: "pre-wrap",
              fontFamily: "'DM Mono', monospace",
              margin: 0,
            }}>
              {result}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const { sections, sectionOrder } = extractSections(result);

  return (
    <div style={rootStyle}>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", justifyContent: "flex-end" }}>
          <button onClick={() => exportTXT(title, result)} style={{ fontSize: "11px", padding: "5px 12px", background: "transparent", border: "1px solid #888578", borderRadius: "4px", color: "#F0EDE6", cursor: "pointer", letterSpacing: "0.04em" }}>
            Download TXT
          </button>
          
        </div>

        {sectionOrder.map((key) => {
          const content = refinedSections[key] || sections[key];
          return content ? (
            <SectionBlock
              key={key}
              label={SECTION_LABELS[key] || key}
              sectionKey={key}
              content={content}
              onRefine={handleRefine}
            />
          ) : null;
        })}
      </div>
    </div>
  );
}