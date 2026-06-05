"use client";
import { useState, useCallback } from "react";

export function useDeleteLock() {
  const [locked, setLocked] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setLocked(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  return { locked, toggleLock: toggle } as const;
}
