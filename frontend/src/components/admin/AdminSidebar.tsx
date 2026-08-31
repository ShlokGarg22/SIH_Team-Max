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
      {/* ------------------------------------------------------------------- */}
      {/* Mobile Drawer Backdrop */}
      {/* ------------------------------------------------------------------- */}
      {mobileOpen && (
        <div
          onClick={onToggleMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Sidebar Component (Desktop + Mobile) */}
      {/* ------------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-zinc-800/80 bg-zinc-950 p-4 transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${isCollapsed && !mobileOpen ? "md:w-20" : "md:w-64"}`}
      >
        <div>
          {/* Brand & Collapse Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Abstract AI Workbench Spark Icon */}
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              {/* Brand Title (Hidden when collapsed on desktop) */}
              {(!isCollapsed || mobileOpen) && (
                <div className="truncate">
                  <h1 className="font-bold text-xs tracking-wider text-zinc-100 uppercase">
                    AI WORKBENCH
                  </h1>
                  <p className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase mt-0.5">
                    ADMIN PORTAL
                  </p>
                </div>
              )}
            </div>

            {/* Collapse Toggle Button (Desktop Only) */}
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
            >
              <svg
                className={`w-4 h-4 transform transition-transform duration-300 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onToggleMobile}
              className="md:hidden text-zinc-400 hover:text-white p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {/* Dashboard Navigation Link */}
            <button
              onClick={() => {
                onSelectTab("dashboard");
                if (mobileOpen) onToggleMobile();
              }}
              title="Dashboard"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                activeTab === "dashboard"
                  ? "bg-indigo-600/10 text-zinc-100 border border-indigo-500/30 shadow-sm shadow-indigo-500/5"
                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
              } ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}
            >
              {activeTab === "dashboard" && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full" />
              )}
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === "dashboard" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              {(!isCollapsed || mobileOpen) && <span className="truncate">Dashboard</span>}
            </button>

            {/* Documents Navigation Link */}
            <button
              onClick={() => {
                onSelectTab("documents");
                if (mobileOpen) onToggleMobile();
              }}
              title="Documents"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                activeTab === "documents"
                  ? "bg-indigo-600/10 text-zinc-100 border border-indigo-500/30 shadow-sm shadow-indigo-500/5"
                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
              } ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}
            >
              {activeTab === "documents" && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full" />
              )}
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === "documents" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {(!isCollapsed || mobileOpen) && <span className="truncate">Documents</span>}
            </button>

            {/* Rules Navigation Link */}
            <button
              onClick={() => {
                onSelectTab("rules");
                if (mobileOpen) onToggleMobile();
              }}
              title="Rules"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                activeTab === "rules"
                  ? "bg-indigo-600/10 text-zinc-100 border border-indigo-500/30 shadow-sm shadow-indigo-500/5"
                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
              } ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}
            >
              {activeTab === "rules" && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full" />
              )}
              <svg
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === "rules" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              {(!isCollapsed || mobileOpen) && <span className="truncate">Rules</span>}
            </button>
          </nav>
        </div>

        {/* Footer Area (Status Indicator + Logout) */}
        <div className="pt-4 border-t border-zinc-900 space-y-3">
          {/* Backend Health Badge */}
          {(!isCollapsed || mobileOpen) ? (
            <div className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400">FastAPI Engine</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
              title={`FastAPI Engine: ${healthStatus}`}
              className="flex items-center justify-center p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  healthStatus === "Connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={() => {
              if (confirm("Log out of Admin Portal? This will clear browser session credentials.")) {
                window.location.href = "http://logout:logout@" + window.location.host + "/admin";
              }
            }}
            title="Logout"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 group ${
              isCollapsed && !mobileOpen ? "justify-center" : ""
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-red-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {(!isCollapsed || mobileOpen) && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
