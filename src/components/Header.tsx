"use client";
import { useState } from "react";
import { exportAllTXT, exportAllPDF, exportCopyrightPackage } from "@/lib/export";

type ViewMode = "composition" | "suno";
type SunoPrompt = { styleBlock: string; lyricsBlock: string; updatedAt: number };

interface HeaderProps {
  title: string;
  composition: string;
  coverResult: string;
  videoResult: string;
  vocalTone?: string;
  style: string;
  language: string;
  onClear: () => void;
  sunoPrompt: SunoPrompt | null;
  viewMode: ViewMode;
}

function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      throw new Error("no clipboard");
    }
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(el);
  }
}

export default function Header({ title, composition, coverResult, videoResult, vocalTone, style, language, onClear, sunoPrompt, viewMode }: HeaderProps) {
  const hasContent = !!(composition || coverResult || videoResult || viewMode === "suno");
  const [showSuno, setShowSuno] = useState(false);
  const [showNoBuildMsg, setShowNoBuildMsg] = useState(false);
  const [showCopyright, setShowCopyright] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function openSuno() {
    if (sunoPrompt) {
      setShowSuno(true);
    } else {
      setShowNoBuildMsg(true);
      setTimeout(() => setShowNoBuildMsg(false), 2500);
    }
  }

  function copy(text: string, key: string) {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function copyAll() {
    if (!sunoPrompt) return;
    copyToClipboard(`STYLE OF MUSIC:\n${sunoPrompt.styleBlock}\n\nLYRICS:\n${sunoPrompt.lyricsBlock}`);
    setCopied("all");
    setTimeout(() => setCopied(null), 1500);
  }

  function handleCopyrightExport() {
    exportCopyrightPackage(title, authorName, composition, style, language);
    setShowCopyright(false);
  }

  return (
    <>
      <header style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: "linear-gradient(135deg, #A855F7, #F59E0B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px",
          }}>🎤</div>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "14px", fontWeight: 600,
              color: "var(--text-primary)", letterSpacing: "0.02em",
            }}>HIP-HOP & R&B FORGE</div>
            <div style={{
              fontSize: "10px", color: "var(--purple-dim)",
              letterSpacing: "0.12em", textTransform: "uppercase" as const,
              marginTop: "-2px",
            }}>AI Composition Suite</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {hasContent && (
            <>
              <button onClick={onClear} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #3A3A42", borderRadius: "6px", color: "#888578", fontSize: "12px", cursor: "pointer", letterSpacing: "0.04em" }}>
                New Composition
              </button>
              {composition && (
                <button onClick={() => setShowCopyright(true)} style={{ padding: "6px 14px", background: "#1A1020", border: "1px solid #6D28D9", borderRadius: "6px", color: "#C084FC", fontSize: "12px", cursor: "pointer", letterSpacing: "0.04em" }}>
                  © Copyright
                </button>
              )}
              {(composition || sunoPrompt) && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={openSuno}
                    style={{
                      padding: "6px 14px",
                      background: sunoPrompt ? "#1A1020" : "#141010",
                      border: `1px solid ${sunoPrompt ? "#A855F7" : "#3A2A50"}`,
                      borderRadius: "6px",
                      color: sunoPrompt ? "#C084FC" : "#5A3870",
                      fontSize: "12px", cursor: "pointer",
                      letterSpacing: "0.04em", transition: "all 0.2s",
                    }}
                    title={sunoPrompt ? "Open Suno Prompt" : "Build Suno Prompt first"}
                  >
                    Suno ↗
                  </button>
                  {showNoBuildMsg && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)", right: 0,
                      background: "#1A1010", border: "1px solid #7A3030", borderRadius: "6px",
                      padding: "7px 12px", fontSize: "11px", color: "#D08080",
                      whiteSpace: "nowrap", zIndex: 200, boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    }}>
                      Use "Build Suno Prompt" below first
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => exportAllTXT(title, composition, coverResult, videoResult)} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #888578", borderRadius: "6px", color: "#F0EDE6", fontSize: "12px", cursor: "pointer", letterSpacing: "0.04em" }}>
                Export All TXT
              </button>
              <button onClick={() => exportAllPDF(title, composition, coverResult, videoResult)} style={{ padding: "6px 14px", background: "var(--border-purple)", border: "1px solid var(--purple-dim)", borderRadius: "6px", color: "var(--purple-light)", fontSize: "12px", cursor: "pointer", letterSpacing: "0.04em" }}>
                Export All PDF
              </button>
            </>
          )}
        </div>
      </header>

      {/* COPYRIGHT MODAL */}
      {showCopyright && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCopyright(false); }}>
          <div style={{ background: "#141418", border: "1px solid #6D28D9", borderRadius: "12px", width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#C084FC", fontWeight: 600 }}>© Copyright Package</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Timestamped authorship document for rights registration</div>
              </div>
              <button onClick={() => setShowCopyright(false)} style={{ background: "transparent", border: "1px solid #3A3A42", borderRadius: "6px", color: "#888578", fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ padding: "12px 14px", background: "#1A1020", border: "1px solid #6D28D9", borderRadius: "8px", fontSize: "11px", color: "#C084FC", lineHeight: 1.6 }}>
                The document will include: title, style, timestamp, full composition text, lyrics, authorship declaration, and performing rights organization fields — ready for submission.
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#6A6860", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "6px", fontWeight: 500 }}>Author Name</div>
                <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Your full name"
                  style={{ width: "100%", padding: "10px 12px", background: "#1A1A1F", border: "1px solid #3A3A42", borderRadius: "8px", color: "#F0EDE6", fontSize: "13px", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const }} />
              </div>
              <div style={{ padding: "10px 14px", background: "#141418", border: "1px solid #2A2A30", borderRadius: "8px", fontSize: "11px", color: "#6A6860", lineHeight: 1.6 }}>
                <strong style={{ color: "#888578" }}>Track:</strong> {title || "Untitled"}<br />
                <strong style={{ color: "#888578" }}>Style:</strong> {style}<br />
                <strong style={{ color: "#888578" }}>Language:</strong> {language}<br />
                <strong style={{ color: "#888578" }}>Timestamp:</strong> {new Date().toLocaleString()}
              </div>
              <button onClick={handleCopyrightExport} disabled={!authorName.trim()}
                style={{ width: "100%", padding: "11px", background: authorName.trim() ? "#1A1020" : "#1A1A1F", border: `1px solid ${authorName.trim() ? "#6D28D9" : "#2A2A30"}`, borderRadius: "8px", color: authorName.trim() ? "#C084FC" : "#4A4840", fontSize: "13px", fontWeight: 500, cursor: authorName.trim() ? "pointer" : "not-allowed", letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
                Download Copyright Package TXT ↓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUNO MODAL */}
      {showSuno && sunoPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSuno(false); }}>
          <div style={{ background: "#141418", border: "1px solid var(--border)", borderRadius: "12px", width: "100%", maxWidth: "720px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>Suno Prompt</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Ready · built {new Date(sunoPrompt.updatedAt).toLocaleTimeString()}{vocalTone ? ` · ${vocalTone}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={copyAll}
                  style={{ fontSize: "11px", padding: "5px 12px", background: copied === "all" ? "#1A1020" : "#1A1A1F", border: `1px solid ${copied === "all" ? "#A855F7" : "#3A3A42"}`, borderRadius: "6px", color: copied === "all" ? "#C084FC" : "#888578", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {copied === "all" ? "Copied ✓" : "Copy All"}
                </button>
                <button onClick={() => setShowSuno(false)} style={{ background: "transparent", border: "1px solid #3A3A42", borderRadius: "6px", color: "#888578", fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}>✕ Close</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {sunoPrompt.styleBlock && (
                <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ padding: "8px 14px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", color: "#A855F7", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Block 1 — Style of Music</span>
                    <button onClick={() => copy(sunoPrompt.styleBlock, "style")} style={{ fontSize: "11px", padding: "3px 10px", background: copied === "style" ? "#1A1020" : "transparent", border: `1px solid ${copied === "style" ? "#A855F7" : "#888578"}`, borderRadius: "4px", color: copied === "style" ? "#C084FC" : "#F0EDE6", cursor: "pointer" }}>
                      {copied === "style" ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <div style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.7", fontFamily: "'DM Mono', monospace", background: "var(--bg-card)", maxHeight: "160px", overflowY: "auto" as const }}>
                    {sunoPrompt.styleBlock}
                  </div>
                </div>
              )}
              {sunoPrompt.lyricsBlock && (
                <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ padding: "8px 14px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", color: "#A855F7", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Block 2 — Lyrics</span>
                    <button onClick={() => copy(sunoPrompt.lyricsBlock, "lyrics")} style={{ fontSize: "11px", padding: "3px 10px", background: copied === "lyrics" ? "#1A1020" : "transparent", border: `1px solid ${copied === "lyrics" ? "#A855F7" : "#888578"}`, borderRadius: "4px", color: copied === "lyrics" ? "#C084FC" : "#F0EDE6", cursor: "pointer" }}>
                      {copied === "lyrics" ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <div style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.7", fontFamily: "'DM Mono', monospace", background: "var(--bg-card)", whiteSpace: "pre-wrap" as const, maxHeight: "400px", overflowY: "auto" as const }}>
                    {sunoPrompt.lyricsBlock}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
