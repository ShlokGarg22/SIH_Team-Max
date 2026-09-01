"use client";

import React from "react";

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {/* Avatar */}
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[var(--m-accent)] to-[#7c5cfc] flex items-center justify-center">
        <span className="text-white text-xs font-bold">M</span>
      </div>

      {/* Typing dots */}
      <div className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--m-bg-surface)]">
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--m-text-tertiary)]" />
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--m-text-tertiary)]" />
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--m-text-tertiary)]" />
        <span className="ml-2 text-xs text-[var(--m-text-muted)]">Meridian is thinking...</span>
      </div>
    </div>
  );
}
