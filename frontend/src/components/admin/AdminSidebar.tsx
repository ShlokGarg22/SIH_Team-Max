"use client";

import React from "react";

export type AdminTab = "dashboard" | "documents" | "rules";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  healthStatus?: string;
}

/* Meridian compass logo — matches ChatSidebar */
function MeridianLogo({ className = "w-5 h-5" }: { className?: string }) {
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

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onToggleMobile,
  healthStatus = "Checking...",
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onToggleMobile}
          className="fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-[var(--m-border)] bg-[var(--m-bg-secondary)] text-[var(--m-text-secondary)] p-3.5 transition-all duration-200 ease-in-out md:static md:translate-x-0 shadow-[4px_0_16px_rgba(0,0,0,0.3)] ${
          mobileOpen ? "translate-x-0 w-60" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed && !mobileOpen ? "md:w-16" : "md:w-60"}`}
      >
        <div>
          {/* Header & Meridian Logo */}
          <div className="flex items-center justify-between px-1 py-1 mb-5 border-b border-[var(--m-border-subtle)] pb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--m-accent)] to-[#7c5cfc] flex items-center justify-center text-white shrink-0 shadow-md shadow-[var(--m-accent)]/20">
                <MeridianLogo className="w-5 h-5" />
              </div>

              {(!isCollapsed || mobileOpen) && (
                <div className="truncate">
                  <h1 className="text-xl font-bold text-[var(--m-text-primary)] leading-tight tracking-tight">Meridian</h1>
                  <p className="text-[10px] text-[var(--m-accent)] font-semibold tracking-wider uppercase">Admin Portal</p>
                </div>
              )}
            </div>

            {/* Collapse Toggle Button (Desktop) */}
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="hidden md:flex p-1 rounded-md text-[var(--m-text-muted)] hover:bg-[var(--m-bg-hover)] hover:text-[var(--m-text-secondary)] transition-colors cursor-pointer"
            >
              <svg
                className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Close Button (Mobile) */}
            <button onClick={onToggleMobile} className="md:hidden text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] p-1 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {/* Dashboard Link */}
            <button
              onClick={() => {
                onSelectTab("dashboard");
                if (mobileOpen) onToggleMobile();
              }}
              title="Dashboard"
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-[var(--m-accent)]/10 text-[var(--m-accent)] border-l-2 border-[var(--m-accent)]"
                  : "text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-hover)] hover:text-[var(--m-text-primary)]"
              } ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}
            >
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === "dashboard" ? "text-[var(--m-accent)]" : "text-[var(--m-text-muted)] group-hover:text-[var(--m-text-secondary)]"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {(!isCollapsed || mobileOpen) && <span className="truncate">Dashboard</span>}
            </button>

            {/* Documents Link */}
            <button
              onClick={() => {
                onSelectTab("documents");
                if (mobileOpen) onToggleMobile();
              }}
              title="Documents"
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                activeTab === "documents"
                  ? "bg-[var(--m-accent)]/10 text-[var(--m-accent)] border-l-2 border-[var(--m-accent)]"
                  : "text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-hover)] hover:text-[var(--m-text-primary)]"
              } ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}
            >
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === "documents" ? "text-[var(--m-accent)]" : "text-[var(--m-text-muted)] group-hover:text-[var(--m-text-secondary)]"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {(!isCollapsed || mobileOpen) && <span className="truncate">Documents</span>}
            </button>

            {/* Rules Link */}
            <button
              onClick={() => {
                onSelectTab("rules");
                if (mobileOpen) onToggleMobile();
              }}
              title="Rules"
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                activeTab === "rules"
                  ? "bg-[#7c5cfc]/10 text-[#7c5cfc] border-l-2 border-[#7c5cfc]"
                  : "text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-hover)] hover:text-[var(--m-text-primary)]"
              } ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}
            >
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === "rules" ? "text-[#7c5cfc]" : "text-[var(--m-text-muted)] group-hover:text-[var(--m-text-secondary)]"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {(!isCollapsed || mobileOpen) && <span className="truncate">Rules</span>}
            </button>

            {/* Back to Chat Link */}
            <div className="pt-2 mt-2 border-t border-[var(--m-border-subtle)]">
              <a
                href="/"
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[var(--m-text-muted)] hover:bg-[var(--m-bg-hover)] hover:text-[var(--m-text-primary)] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {(!isCollapsed || mobileOpen) && <span className="truncate">Back to Chat</span>}
              </a>
            </div>
          </nav>
        </div>

        {/* Footer Area */}
        <div className="pt-3 border-t border-[var(--m-border-subtle)] space-y-2">
          {(!isCollapsed || mobileOpen) ? (
            <div className="px-2.5 py-1.5 rounded-lg bg-[var(--m-bg-surface)] border border-[var(--m-border)] flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--m-text-muted)]">FastAPI</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                  healthStatus === "Connected"
                    ? "bg-[var(--m-success)]/10 text-[var(--m-success)] border border-[var(--m-success)]/20"
                    : "bg-[var(--m-warning)]/10 text-[var(--m-warning)] border border-[var(--m-warning)]/20"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    healthStatus === "Connected" ? "bg-[var(--m-success)] animate-pulse" : "bg-[var(--m-warning)]"
                  }`}
                />
                {healthStatus}
              </span>
            </div>
          ) : (
            <div
              title={`FastAPI Status: ${healthStatus}`}
              className="flex items-center justify-center p-1.5 rounded-lg bg-[var(--m-bg-surface)] border border-[var(--m-border)]"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  healthStatus === "Connected" ? "bg-[var(--m-success)] animate-pulse" : "bg-[var(--m-warning)]"
                }`}
              />
            </div>
          )}

          <button
            onClick={() => {
              if (confirm("Log out of Admin Portal? This will clear browser credentials.")) {
                window.location.href = "http://logout:logout@" + window.location.host + "/admin";
              }
            }}
            title="Logout"
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--m-text-muted)] hover:bg-[var(--m-error)]/10 hover:text-[var(--m-error)] transition-colors border border-transparent hover:border-[var(--m-error)]/20 cursor-pointer ${
              isCollapsed && !mobileOpen ? "justify-center" : ""
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {(!isCollapsed || mobileOpen) && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
