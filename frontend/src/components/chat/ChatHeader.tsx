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


      </div>

      <div className="flex items-center gap-2" />
    </header>
  );
}
