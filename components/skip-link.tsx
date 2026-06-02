"use client";

import { useEffect } from "react";

export default function SkipLink() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const el = document.getElementById("skip-link");
        if (el) el.style.position = "absolute";
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <a
      id="skip-link"
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:border focus:border-gray-400 focus:rounded-lg focus:text-sm focus:shadow-lg focus:outline-none"
    >
      Ana icerige git
    </a>
  );
}