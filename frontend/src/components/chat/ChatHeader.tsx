"use client";

import React from "react";
import type { ChatMode } from "@/lib/api";

interface ChatHeaderProps {
  sessionTitle: string;
  activeMode: ChatMode;
  onToggleSidebar: () => void;
  showSidebarToggle?: boolean;
}

export default function ChatHeader({
  sessionTitle,
  activeMode,
  onToggleSidebar,
  showSidebarToggle = true,
}: ChatHeaderProps) {
  return (
    <header className="h-12 shrink-0 border-b border-[var(--m-border-subtle)] bg-[var(--m-bg-primary)]/80 backdrop-blur-xl px-4 flex items-center justify-between relative z-20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Sidebar toggle */}
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-surface)] transition-all shrink-0 cursor-pointer"
            title="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Session title */}
        <h2 className="text-lg font-bold text-[var(--m-text-primary)] truncate tracking-tight">
          {sessionTitle}
        </h2>

        {/* Mode badge */}
        {sessionTitle !== "Meridian" && (
          <span
            className={`
              shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1
              ${
                activeMode === "deep_research"
                  ? "bg-[#7c5cfc]/15 text-[#a78bfa] border border-[#7c5cfc]/20"
                  : "bg-[var(--m-accent-subtle)] text-[var(--m-accent)] border border-[var(--m-accent)]/15"
              }
            `}
          >
            {activeMode === "deep_research" ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Research
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Standard
              </>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2" />
    </header>
  );
}
