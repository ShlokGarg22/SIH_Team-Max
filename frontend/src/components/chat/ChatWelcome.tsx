"use client";

import React from "react";
import type { ChatMode } from "@/lib/api";
import ModeSelector from "./ModeSelector";

interface ChatWelcomeProps {
  activeMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

/** Meridian compass-style SVG logo icon */
function MeridianLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M24 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 28V44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M4 24H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M28 24H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <circle cx="24" cy="24" r="4" fill="currentColor" />
      <path d="M24 10L27 20H21L24 10Z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export default function ChatWelcome({ activeMode, onModeChange }: ChatWelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 relative z-10">
      {/* Logo */}
      <div className="mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--m-accent)] to-[#7c5cfc] flex items-center justify-center shadow-lg shadow-[var(--m-accent)]/20 text-white">
          <MeridianLogo className="w-8 h-8" />
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-semibold text-[var(--m-text-primary)] mb-3 tracking-tight">
        What can I help you with?
      </h1>
      <p className="text-sm text-[var(--m-text-tertiary)] mb-5 text-center max-w-md">
        Ask about SOPs, analyze data, inspect equipment images, or run
        deep research — all processed locally on your machine.
      </p>

      {/* Mode Selector */}
      <ModeSelector activeMode={activeMode} onModeChange={onModeChange} />
    </div>
  );
}
