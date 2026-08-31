"use client";

import React from "react";

export default function AdminAuth() {
  const handleLogout = () => {
    if (confirm("Log out of Admin Portal? This will clear browser credentials.")) {
      window.location.href = "http://logout:logout@" + window.location.host + "/admin";
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 flex items-center justify-between shadow-lg shadow-black/20">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
          ✓
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-100">Basic Authentication Active</p>
          <p className="text-[11px] text-zinc-400">
            Protected via server-side environment variables in `src/middleware.ts`
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="px-3 py-1 rounded text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
