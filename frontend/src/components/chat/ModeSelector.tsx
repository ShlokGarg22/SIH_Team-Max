"use client";

import React from "react";
import type { ChatMode } from "@/lib/api";

interface ModeSelectorProps {
  activeMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

/* Inline SVG icons — no emojis */
function BoltIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ResearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
  );
}

export default function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
  const modes: { id: ChatMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: "standard",
      label: "Standard",
      icon: <BoltIcon />,
      description: "Grounded RAG answers with citations",
    },
    {
      id: "deep_research",
      label: "Deep Research",
      icon: <ResearchIcon />,
      description: "Multi-step investigation mode",
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            title={mode.description}
            className={`
              mode-pill flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 cursor-pointer select-none
              ${
                isActive
                  ? "bg-gradient-to-r from-[var(--m-accent)] to-[#7c5cfc] text-white shadow-md shadow-[var(--m-accent)]/25 mode-pill-active"
                  : "bg-[var(--m-bg-surface)] text-[var(--m-text-secondary)] border border-[var(--m-border)] hover:border-[#7c5cfc]/50 hover:text-[var(--m-text-primary)]"
              }
            `}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
