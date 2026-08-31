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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-zinc-800 bg-zinc-950 text-zinc-300 p-3.5 transition-all duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0 w-60" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed && !mobileOpen ? "md:w-16" : "md:w-60"}`}
      >
        <div>
          {/* Header & Logo */}
          <div className="flex items-center justify-between px-1 py-1 mb-5 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {/* Gradient Logo Accent */}
              <div className="h-7 w-7 rounded-md bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md shadow-indigo-500/20">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              {(!isCollapsed || mobileOpen) && (
                <div className="truncate">
                  <h1 className="font-bold text-xs text-zinc-100 leading-tight tracking-tight">AI Workbench</h1>
                  <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">ADMIN PORTAL</p>
                </div>
              )}
            </div>

            {/* Collapse Toggle Button (Desktop) */}
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="hidden md:flex p-1 rounded-md text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
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
            <button onClick={onToggleMobile} className="md:hidden text-zinc-400 hover:text-zinc-100 p-1">
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
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-semibold transition-all group ${
                activeTab === "dashboard"
                  ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-xs"
                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
              } ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}
            >
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === "dashboard" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
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
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-semibold transition-all group ${
                activeTab === "documents"
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-xs"
                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
              } ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}
            >
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === "documents" ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300"
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
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-semibold transition-all group ${
                activeTab === "rules"
                  ? "bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-xs"
                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
              } ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}
            >
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === "rules" ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
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
          </nav>
        </div>

        {/* Footer Area */}
        <div className="pt-3 border-t border-zinc-800 space-y-2">
          {(!isCollapsed || mobileOpen) ? (
            <div className="px-2.5 py-1.5 rounded-md bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400">FastAPI</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                  healthStatus === "Connected"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    healthStatus === "Connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {healthStatus}
              </span>
            </div>
          ) : (
            <div
              title={`FastAPI Status: ${healthStatus}`}
              className="flex items-center justify-center p-1.5 rounded-md bg-zinc-900 border border-zinc-800"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  healthStatus === "Connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
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
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20 ${
              isCollapsed && !mobileOpen ? "justify-center" : ""
            }`}
          >
            <svg className="w-4 h-4 shrink-0 text-zinc-400 hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {(!isCollapsed || mobileOpen) && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
