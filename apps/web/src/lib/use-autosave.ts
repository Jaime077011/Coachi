"use client";

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Builders have no Save button: every change saves itself after a short pause.
 * `version` changes whenever the draft changes; the first value (what was loaded) isn't saved.
 */
export function useAutosave<T>(value: T | null, version: number, save: (value: T) => Promise<unknown>, delay = 800) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveRef = useRef(save);
  const latest = useRef(value);
  useEffect(() => {
    saveRef.current = save;
    latest.current = value;
  });

  useEffect(() => {
    if (version === 0 || latest.current === null) return;
    const timer = setTimeout(() => {
      setStatus("saving");
      saveRef
        .current(latest.current as T)
        .then(() => setStatus("saved"))
        .catch(() => setStatus("error"));
    }, delay);
    return () => clearTimeout(timer);
  }, [version, delay]);

  return status;
}
