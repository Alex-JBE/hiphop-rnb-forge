import { useState } from "react";
import { Draft } from "@/lib/useDrafts";

interface DraftsPanelProps {
  drafts: Draft[];
  onLoad: (draft: Draft) => void;
  onDelete: (id: string) => void;
  onStar: (id: string) => void;
}

export default function DraftsPanel({ drafts, onLoad, onDelete, onStar }: DraftsPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = drafts.filter(d => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.styles.some(s => s.toLowerCase().includes(q))
    );
  });

  const starred = filtered.filter(d => d.starred);
  const recent = filtered.filter(d => !d.starred);

  function DraftItem({ draft }: { draft: Draft }) {
    return (
      <div
        onClick={() => onLoad(draft)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "6px",
          padding: "6px 8px",
          borderRadius: "6px",
          cursor: "pointer",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#1A1A1F")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: 500, color: "#C8C5BE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {draft.title}
          </div>
          <div style={{ fontSize: "11px", color: "#6A6860", marginTop: "2px" }}>
            {draft.styles.join(" + ")} · {draft.createdAt}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0, marginTop: "2px" }}>
          <button
            onClick={e => { e.stopPropagation(); onStar(draft.id); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "14px", color: draft.starred ? "#A855F7" : "#888578",
              padding: "0", lineHeight: 1, transition: "color 0.15s",
            }}
            title={draft.starred ? "Remove from favorites" : "Add to favorites"}
          >★</button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(draft.id); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "13px", color: "#888578", padding: "0", lineHeight: 1, transition: "color 0.15s",
            }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = "#FF6B6B")}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = "#888578")}
          >✕</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Search */}
      <div style={{ padding: "0 12px 8px" }}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
            fontSize: "12px", color: "#4A4840", pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or style..."
            style={{
              width: "100%", padding: "6px 10px 6px 28px",
              background: "#1A1A1F", border: "1px solid #2A2A30",
              borderRadius: "6px", color: "#C8C5BE",
              fontSize: "11px", outline: "none",
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: "border-box" as const,
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#A855F7")}
            onBlur={e => (e.currentTarget.style.borderColor = "#2A2A30")}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#6A6860",
                cursor: "pointer", fontSize: "12px", padding: 0, lineHeight: 1,
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Empty states */}
      {drafts.length === 0 && (
        <div style={{ padding: "12px 16px" }}>
          <p style={{ fontSize: "12px", color: "#6A6860", fontStyle: "italic" }}>No saved drafts yet</p>
        </div>
      )}

      {drafts.length > 0 && filtered.length === 0 && (
        <div style={{ padding: "12px 16px" }}>
          <p style={{ fontSize: "12px", color: "#6A6860", fontStyle: "italic" }}>No drafts match "{search}"</p>
        </div>
      )}

      {/* Starred */}
      {starred.length > 0 && (
        <>
          <div style={{ fontSize: "9px", color: "#A855F7", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 16px 2px", fontWeight: 600 }}>
            ★ Starred
          </div>
          <div style={{ padding: "0 8px" }}>
            {starred.map(d => <DraftItem key={d.id} draft={d} />)}
          </div>
          {recent.length > 0 && (
            <div style={{ fontSize: "9px", color: "#6A6860", letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 16px 2px", fontWeight: 600 }}>
              Recent
            </div>
          )}
        </>
      )}

      {/* Recent */}
      <div style={{ padding: "0 8px" }}>
        {recent.map(d => <DraftItem key={d.id} draft={d} />)}
      </div>

      {/* Count */}
      {drafts.length > 0 && (
        <div style={{ padding: "8px 16px 4px", fontSize: "10px", color: "#4A4840", textAlign: "right" as const }}>
          {filtered.length} of {drafts.length} drafts
        </div>
      )}
    </div>
  );
}
