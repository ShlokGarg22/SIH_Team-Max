"use client";

import React, { useState } from "react";
import type { ChatSession } from "@/lib/api";

/* ---- Types ---- */
export interface UserAccount {
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginClick: () => void;
  onSettingsClick: () => void;
}

/* ---- SVG Meridian Logo ---- */
function MeridianLogo({ className = "w-6 h-6" }: { className?: string }) {
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

/* ---- Date Grouping ---- */
function groupSessionsByDate(sessions: ChatSession[]): Map<string, ChatSession[]> {
  const groups = new Map<string, ChatSession[]>();
  const now = Date.now();
  const oneDay = 86400000;

  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  for (const session of sorted) {
    const ageMs = now - session.updatedAt;
    let label: string;

    if (ageMs < oneDay) label = "Today";
    else if (ageMs < 2 * oneDay) label = "Yesterday";
    else if (ageMs < 7 * oneDay) label = "Last 7 Days";
    else if (ageMs < 30 * oneDay) label = "Last 30 Days";
    else {
      const date = new Date(session.updatedAt);
      label = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(session);
  }

  return groups;
}

/* ---- User Initials ---- */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose,
  currentUser,
  onLoginClick,
  onSettingsClick,
}: ChatSidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const grouped = groupSessionsByDate(sessions);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--m-bg-secondary)]">
      {/* Header: Logo + New Chat */}
      <div className="p-3 pb-2">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-1.5 mb-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--m-accent)] to-[#7c5cfc] flex items-center justify-center text-white">
            <MeridianLogo className="w-5.5 h-5.5" />
          </div>
          <span className="text-xl font-bold text-[var(--m-text-primary)] tracking-tight">Meridian</span>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="
            w-full flex items-center justify-center gap-2
            px-3 py-2.5 rounded-xl
            bg-[var(--m-bg-surface)] border border-[var(--m-border)]
            text-sm font-medium text-[var(--m-text-secondary)]
            hover:bg-[var(--m-bg-hover)] hover:text-[var(--m-text-primary)] hover:border-[var(--m-accent)]/30
            transition-all duration-200 cursor-pointer
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {sessions.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-[var(--m-text-muted)]">No conversations yet</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([dateLabel, dateSessions]) => (
            <div key={dateLabel} className="mb-2">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--m-text-muted)] uppercase tracking-wider">
                {dateLabel}
              </div>
              {dateSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isHovered = hoveredSession === session.id;

                return (
                  <div
                    key={session.id}
                    onMouseEnter={() => setHoveredSession(session.id)}
                    onMouseLeave={() => setHoveredSession(null)}
                    className="relative"
                  >
                    <button
                      onClick={() => {
                        onSelectSession(session.id);
                        onClose();
                      }}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm truncate
                        transition-all duration-150 cursor-pointer
                        ${
                          isActive
                            ? "bg-[var(--m-bg-hover)] text-[var(--m-text-primary)] border-l-2 border-[var(--m-accent)]"
                            : "text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-surface)] hover:text-[var(--m-text-primary)]"
                        }
                      `}
                    >
                      <span className="block truncate">{session.title}</span>
                    </button>

                    {isHovered && !isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--m-text-muted)] hover:text-[var(--m-error)] hover:bg-[var(--m-error)]/10 transition-all cursor-pointer"
                        title="Delete conversation"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Bottom: User Accounts Section */}
      <div className="border-t border-[var(--m-border-subtle)] relative">
        {/* Account menu popup */}
        {showAccountMenu && (
          <div className="absolute bottom-full left-2 right-2 mb-1 bg-[var(--m-bg-surface)] border border-[var(--m-border)] rounded-xl shadow-xl shadow-black/30 overflow-hidden z-50">
            {currentUser ? (
              <>
                <div className="px-3 py-2.5 border-b border-[var(--m-border-subtle)]">
                  <p className="text-xs font-semibold text-[var(--m-text-primary)]">{currentUser.name}</p>
                  {currentUser.email && (
                    <p className="text-[10px] text-[var(--m-text-muted)] mt-0.5">{currentUser.email}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    onSettingsClick();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-hover)] hover:text-[var(--m-text-primary)] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    onLoginClick();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-hover)] hover:text-[var(--m-text-primary)] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch Account
                </button>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    // logout handler — placeholder
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--m-error)]/80 hover:bg-[var(--m-error)]/5 hover:text-[var(--m-error)] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </>
            ) : (
              <div className="p-3">
                <p className="text-xs text-[var(--m-text-secondary)] mb-2">Sign in to save your conversations and preferences.</p>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    onLoginClick();
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--m-accent)] text-white text-xs font-semibold hover:bg-[var(--m-accent-hover)] transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}

        {/* User info bar */}
        <div className="p-3">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--m-bg-surface)] transition-colors cursor-pointer group"
          >
            {/* Avatar */}
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--m-accent)]/30 to-[#7c5cfc]/30 flex items-center justify-center text-xs font-semibold text-[var(--m-text-secondary)]">
                {currentUser ? getInitials(currentUser.name) : "?"}
              </div>
            )}

            {/* Name + role */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-[var(--m-text-primary)] truncate">
                {currentUser?.name || "Guest"}
              </p>
              <p className="text-[10px] text-[var(--m-text-muted)]">
                {currentUser?.role || "On-Premise"}
              </p>
            </div>

            {/* Settings gear */}
            <svg
              className="w-4 h-4 text-[var(--m-text-muted)] group-hover:text-[var(--m-text-secondary)] transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex shrink-0 h-full sidebar-transition relative z-30
          ${isOpen ? "w-[var(--m-sidebar-width)]" : "w-0"}
          overflow-hidden border-r border-[var(--m-border)] shadow-[4px_0_16px_rgba(0,0,0,0.3)]
        `}
      >
        <div className="w-[var(--m-sidebar-width)] h-full">{sidebarContent}</div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          <div className="relative w-[280px] h-full shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
