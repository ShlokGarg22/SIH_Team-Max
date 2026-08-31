"use client";

import React from "react";

export default function AdminAuth() {
  const handleLogout = () => {
    if (confirm("Log out of Admin Portal? This will clear browser basic auth credentials.")) {
      window.location.href = "http://logout:logout@" + window.location.host + "/admin";
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 flex items-center justify-between shadow-xl shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
          ✓
        </div>
        <div>
          <p className="text-xs font-bold text-white">Basic Authentication Active</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Authenticated via server-side `.env` credentials (`src/middleware.ts`)
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 text-xs font-semibold text-zinc-400 border border-zinc-800 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
