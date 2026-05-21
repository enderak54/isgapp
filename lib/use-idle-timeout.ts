"use client";

import { useEffect, useRef, useCallback } from "react";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useIdleTimeout(onTimeout?: () => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (onTimeout) onTimeout();
      else {
        sessionStorage.clear();
        alert("Güvenlik nedeniyle oturum sonlandırıldı.");
        window.location.reload();
      }
    }, IDLE_TIMEOUT);
  }, [onTimeout]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);

  return resetTimer;
}
