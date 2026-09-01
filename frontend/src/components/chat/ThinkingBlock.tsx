"use client";

import React, { useState } from "react";

interface ThinkingBlockProps {
  content: string;
  durationSeconds?: number;
}

export default function ThinkingBlock({ content, durationSeconds }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const durationText = durationSeconds
    ? `Thought for ${durationSeconds} second${durationSeconds !== 1 ? "s" : ""}`
    : "Thought process";

  return (
    <div className="mb-3">
      {/* Clickable header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-[var(--m-text-tertiary)] hover:text-[var(--m-text-secondary)] transition-colors cursor-pointer select-none group"
      >
        {/* Brain icon */}
        <svg className="w-4 h-4 thinking-icon text-[var(--m-thinking-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="font-medium">{durationText}</span>
        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="thinking-content-enter mt-2">
          <div
            className="
              pl-4 py-3 text-sm leading-relaxed
              border-l-2 border-[var(--m-thinking-accent)]
              bg-[var(--m-thinking-bg)] rounded-r-lg
              text-[var(--m-text-secondary)]
            "
          >
            {content.split("\n").map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <br key={i} />;

              if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
                return (
                  <div key={i} className="flex gap-2 my-1">
                    <span className="text-[var(--m-thinking-accent)] shrink-0">&bull;</span>
                    <span>{trimmed.replace(/^[•\-*]\s*/, "")}</span>
                  </div>
                );
              }

              return <p key={i} className="my-1">{trimmed}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
