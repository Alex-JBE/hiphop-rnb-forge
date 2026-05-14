import { useState, useEffect } from "react";

export interface Draft {
  id: string;
  title: string;
  styles: string[];
  outputType: string;
  result: string;
  createdAt: string;
  starred: boolean;
  // Новые поля — установки композиции
  key?: string;
  tempo?: string;
  intensity?: number;
  language?: string;
  trackMode?: string;
  instruments?: string[];
  mood?: string;
  theme?: string;
}

export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("hiphop-rnb-forge-drafts");
    if (stored) setDrafts(JSON.parse(stored));
  }, []);

  function saveDraft(draft: Omit<Draft, "id" | "createdAt" | "starred">) {
    const newDraft: Draft = {
      ...draft,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleString(),
      starred: false,
    };
    const updated = [newDraft, ...drafts].slice(0, 20);
    setDrafts(updated);
    localStorage.setItem("hiphop-rnb-forge-drafts", JSON.stringify(updated));
    return newDraft;
  }

  function deleteDraft(id: string) {
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    localStorage.setItem("hiphop-rnb-forge-drafts", JSON.stringify(updated));
  }

  function toggleStar(id: string) {
    const updated = drafts.map(d =>
      d.id === id ? { ...d, starred: !d.starred } : d
    );
    setDrafts(updated);
    localStorage.setItem("hiphop-rnb-forge-drafts", JSON.stringify(updated));
  }

  function clearDrafts() {
    setDrafts([]);
    localStorage.removeItem("hiphop-rnb-forge-drafts");
  }

  return { drafts, saveDraft, deleteDraft, toggleStar, clearDrafts };
}