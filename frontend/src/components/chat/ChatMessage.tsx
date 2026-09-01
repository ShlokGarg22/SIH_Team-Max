"use client";

import React, { useState } from "react";
import type { ChatMessage as ChatMessageType, Evidence } from "@/lib/api";
import ThinkingBlock from "./ThinkingBlock";

/* ---- SVG Icon helpers ---- */
function FileIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function PaperclipIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

function MeridianLogo({ className = "w-4 h-4" }: { className?: string }) {
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

/* ---- Markdown Renderer ---- */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeBlockKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${codeBlockKey++}`} className="bg-[var(--m-bg-secondary)] border border-[var(--m-border)] rounded-lg p-3 my-2 overflow-x-auto text-sm">
            <code className="text-[var(--m-text-primary)] font-mono">{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<br key={`br-${i}`} />);
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      elements.push(<h4 key={i} className="text-base font-semibold text-[var(--m-text-secondary)] mt-3 mb-1">{formatInline(trimmed.slice(5))}</h4>);
      continue;
    }
    if (trimmed.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-lg font-semibold text-[var(--m-text-primary)] mt-3 mb-1.5">{formatInline(trimmed.slice(4))}</h3>);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-xl font-bold text-[var(--m-text-primary)] mt-4 mb-2">{formatInline(trimmed.slice(3))}</h2>);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-[var(--m-text-primary)] mt-4 mb-2">{formatInline(trimmed.slice(2))}</h1>);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-3 border-[var(--m-accent)] pl-3 my-1.5 text-[var(--m-text-secondary)] italic">
          {formatInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    if (/^[-*•]\s/.test(trimmed)) {
      elements.push(
        <div key={i} className="flex gap-2 my-0.5 ml-1">
          <span className="text-[var(--m-accent)] shrink-0 mt-0.5">&bull;</span>
          <span className="leading-relaxed">{formatInline(trimmed.replace(/^[-*•]\s*/, ""))}</span>
        </div>
      );
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={i} className="flex gap-2 my-0.5 ml-1">
          <span className="text-[var(--m-accent)] shrink-0 font-medium mt-0.5">{num}.</span>
          <span className="leading-relaxed">{formatInline(trimmed.replace(/^\d+\.\s*/, ""))}</span>
        </div>
      );
      continue;
    }

    elements.push(<p key={i} className="my-0.5 leading-relaxed">{formatInline(trimmed)}</p>);
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index} className="font-semibold text-[var(--m-text-primary)]">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(
        <code key={match.index} className="bg-[var(--m-bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--m-accent)] text-[0.85em] font-mono">
          {match[3]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 0 ? text : <>{parts}</>;
}

/* ---- Evidence Badges ---- */
function EvidenceBadges({ evidence }: { evidence: Evidence[] }) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--m-border-subtle)]">
      <span className="text-[10px] font-semibold text-[var(--m-text-muted)] uppercase tracking-wider mr-1 self-center">Sources:</span>
      {evidence.map((e, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--m-accent-subtle)] text-[var(--m-accent)] text-[11px] font-medium border border-[var(--m-accent)]/10"
          title={e.chunk ? e.chunk.slice(0, 200) : undefined}
        >
          <FileIcon className="w-3 h-3" />
          {e.source}
          {e.page && <span className="text-[var(--m-text-muted)]">p.{e.page}</span>}
          {e.confidence !== undefined && (
            <span className={`ml-0.5 w-1.5 h-1.5 rounded-full ${
              e.confidence >= 0.7 ? "bg-[var(--m-success)]" :
              e.confidence >= 0.4 ? "bg-[var(--m-warning)]" :
              "bg-[var(--m-error)]"
            }`} />
          )}
        </span>
      ))}
    </div>
  );
}

/* ---- Main ChatMessage Component ---- */
export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[75%]">
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end">
              {message.attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--m-bg-surface)] border border-[var(--m-border)] text-xs">
                  <PaperclipIcon className="w-3.5 h-3.5 text-[var(--m-accent)]" />
                  <span className="text-[var(--m-text-secondary)] font-medium">{att.name}</span>
                  <span className="text-[var(--m-text-muted)]">{att.size}</span>
                </div>
              ))}
            </div>
          )}
          <div className="bg-[var(--m-bg-surface)] border border-[var(--m-border)] rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed">
            {message.content}
          </div>
          <div className="text-[10px] text-[var(--m-text-muted)] mt-1 text-right">{timeStr}</div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3 px-4 py-3 group">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--m-accent)] to-[#7c5cfc] flex items-center justify-center mt-0.5 text-white shadow-sm shadow-[var(--m-accent)]/25">
        <MeridianLogo className="w-4.5 h-4.5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        {message.thinking && (
          <ThinkingBlock
            content={message.thinking}
            durationSeconds={message.thinkingDuration}
          />
        )}

        <div className="text-sm text-[var(--m-text-primary)] leading-relaxed">
          {renderMarkdown(message.content)}
        </div>

        <EvidenceBadges evidence={message.evidence || []} />

        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-[var(--m-text-muted)]">{timeStr}</span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-[var(--m-bg-hover)] cursor-pointer flex items-center justify-center"
            title={copied ? "Copied" : "Copy output"}
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-[var(--m-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
