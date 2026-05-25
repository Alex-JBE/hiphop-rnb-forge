import { useState, useCallback, useRef } from "react";

export type ViewMode = "composition" | "suno";

export type SunoPrompt = {
  title: string;
  styleBlock: string;
  lyricsBlock: string;
  updatedAt: number;
};

interface Opts {
  fingerprint: string;
  fullResult: string;
  buildShortPrompt: () => Promise<string>;
}

export interface DualPromptFlow {
  viewMode: ViewMode;
  sunoPrompt: SunoPrompt | null;
  sunoPromptLoading: boolean;
  sunoPromptError: boolean;
  sunoPromptDirty: boolean;
  fullCompositionDirty: boolean;
  buildSunoPrompt: () => Promise<void>;
  resetFlow: () => void;
  onForgeStart: () => void;
  onForgeComplete: (fp: string) => void;
}

export default function useDualPromptFlow({ fingerprint, fullResult, buildShortPrompt }: Opts): DualPromptFlow {
  const [viewMode, setViewMode] = useState<ViewMode>("composition");
  const [sunoPrompt, setSunoPrompt] = useState<SunoPrompt | null>(null);
  const [sunoPromptLoading, setSunoPromptLoading] = useState(false);
  const [sunoPromptError, setSunoPromptError] = useState(false);
  const [lastForgeFingerprint, setLastForgeFingerprint] = useState("");
  const [lastSunoFingerprint, setLastSunoFingerprint] = useState("");

  const fingerprintRef = useRef(fingerprint);
  const fullResultRef = useRef(fullResult);
  const buildShortPromptRef = useRef(buildShortPrompt);
  fingerprintRef.current = fingerprint;
  fullResultRef.current = fullResult;
  buildShortPromptRef.current = buildShortPrompt;

  const fullCompositionDirty = lastForgeFingerprint !== "" && fingerprint !== lastForgeFingerprint;
  const sunoPromptDirty = sunoPrompt !== null && fingerprint !== lastSunoFingerprint;

  const buildSunoPrompt = useCallback(async () => {
    const capturedFp = fingerprintRef.current;
    const capturedFr = fullResultRef.current;

    setSunoPromptLoading(true);
    setSunoPrompt(null);
    setSunoPromptError(false);
    setViewMode("suno");

    try {
      const raw = await buildShortPromptRef.current();

      const styleBlock = raw.match(/STYLE_OF_MUSIC:\s*([\s\S]*?)(?=LYRICS:|$)/)?.[1]?.trim() ?? "";
      const lyricsBlock = raw.match(/LYRICS:\s*([\s\S]*?)$/)?.[1]?.trim() ?? "";

      if (!styleBlock) { setSunoPromptError(true); return; }

      const title = capturedFr.split("\n")
        .find(l => /^#?\s*TITLE:/i.test(l))
        ?.replace(/^#?\s*TITLE:/i, "").trim() ?? "";

      setLastSunoFingerprint(capturedFp);
      setSunoPrompt({ title, styleBlock, lyricsBlock, updatedAt: Date.now() });
    } catch (e) {
      console.error("Suno build failed", e);
      setSunoPromptError(true);
    } finally {
      setSunoPromptLoading(false);
    }
  }, []);

  const resetFlow = useCallback(() => {
    setViewMode("composition");
    setSunoPrompt(null);
    setSunoPromptError(false);
    setLastForgeFingerprint("");
    setLastSunoFingerprint("");
  }, []);

  const onForgeStart = useCallback(() => {
    setViewMode("composition");
  }, []);

  const onForgeComplete = useCallback((fp: string) => {
    setLastForgeFingerprint(fp);
  }, []);

  return {
    viewMode, sunoPrompt, sunoPromptLoading, sunoPromptError,
    sunoPromptDirty, fullCompositionDirty,
    buildSunoPrompt, resetFlow, onForgeStart, onForgeComplete,
  };
}
