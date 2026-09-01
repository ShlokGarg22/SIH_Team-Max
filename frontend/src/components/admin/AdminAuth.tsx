"use client";

import React from "react";

export default function AdminAuth() {
  const handleLogout = () => {
    if (confirm("Log out of Admin Portal? This will clear browser credentials.")) {
      window.location.href = "http://logout:logout@" + window.location.host + "/admin";
    }
  };

  return (
    <div className="bg-[var(--m-bg-secondary)]/70 backdrop-blur-xl border border-[var(--m-border)]/50 rounded-xl p-3.5 flex items-center justify-between shadow-lg shadow-black/20">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-[var(--m-success)]/10 text-[var(--m-success)] border border-[var(--m-success)]/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--m-text-primary)]">Basic Authentication Active</p>
          <p className="text-[11px] text-[var(--m-text-tertiary)]">
            Protected via server-side environment variables in middleware
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="px-3 py-1 rounded-lg text-xs font-semibold text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-[var(--m-bg-hover)] border border-[var(--m-border)] transition-colors cursor-pointer"
      >
        Sign Out
      </button>
    </div>
  );
}
