"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DocumentUpload from "../../components/admin/DocumentUpload";
import DocumentList, { DocumentRecord } from "../../components/admin/DocumentList";
import RulesEditor from "../../components/admin/RulesEditor";
import AdminAuth from "../../components/admin/AdminAuth";
import { checkHealth } from "../../lib/api";

const GradientWaves = dynamic(() => import("@/components/ui/GradientWaves"), {
  ssr: false,
});

type AdminTab = "dashboard" | "documents" | "rules";

/* ---- Meridian compass logo — same as ChatSidebar ---- */
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

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUploadPanel, setShowUploadPanel] = useState<boolean>(false);
  const [showAccountMenu, setShowAccountMenu] = useState<boolean>(false);

  const [healthStatus, setHealthStatus] = useState<string>("Checking...");
  const [backendService, setBackendService] = useState<string>("");

  const [documentList, setDocumentList] = useState<DocumentRecord[]>([
    { id: 1, filename: "SOP-Refinery-Valve-Maintenance.pdf", size: "4.2 MB", uploaded_at: "2026-08-30 14:22", status: "indexed" },
    { id: 2, filename: "Emergency-Shutdown-Procedure-V4.pdf", size: "2.8 MB", uploaded_at: "2026-08-31 09:15", status: "indexed" },
    { id: 3, filename: "Safety-Compliance-Manual-2026.pdf", size: "8.1 MB", uploaded_at: "2026-08-31 16:40", status: "indexed" },
  ]);

  useEffect(() => {
    checkHealth()
      .then((data) => {
        setHealthStatus("Connected");
        setBackendService(data.service || "FastAPI Backend");
      })
      .catch(() => {
        setHealthStatus("Not connected");
      });
  }, []);

  const handleDocumentUploaded = (newDoc: { filename: string; size: string }) => {
    const createdDoc: DocumentRecord = {
      id: Date.now(),
      filename: newDoc.filename,
      size: newDoc.size,
      uploaded_at: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "indexed",
    };
    setDocumentList((prev) => [createdDoc, ...prev]);
  };

  const handleDocumentDeleted = (id: number) => {
    setDocumentList((prev) => prev.filter((d) => d.id !== id));
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "documents",
      label: "Documents",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "rules",
      label: "Rules",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen w-screen bg-[var(--m-bg-primary)] text-[var(--m-text-primary)] font-sans overflow-hidden">
      {/* ============================================================ */}
      {/* SIDEBAR — Mirrors ChatSidebar structure exactly              */}
      {/* ============================================================ */}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:min-w-0 md:p-0 md:border-0 md:overflow-hidden"}
          fixed inset-y-0 left-0 z-50 md:static
          w-[var(--m-sidebar-width)] min-w-[var(--m-sidebar-width)]
          flex flex-col h-full
          bg-[var(--m-bg-secondary)]
          border-r border-[var(--m-border)]
          shadow-[4px_0_16px_rgba(0,0,0,0.3)]
          transition-all duration-200 ease-in-out
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header: Logo — Clickable to route to welcome page (clean without hover box) */}
          <div className="p-3 pb-2">
            <a
              href="/"
              className="flex items-center gap-3 px-2 py-1.5 mb-3 text-left cursor-pointer select-none"
              title="Return to Welcome Screen"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--m-accent)] to-[#7c5cfc] flex items-center justify-center text-white shrink-0 shadow-md shadow-[var(--m-accent)]/20">
                <MeridianLogo className="w-5.5 h-5.5" />
              </div>
              <span className="text-xl font-bold text-[var(--m-text-primary)] tracking-tight">Meridian</span>
            </a>

            {/* Admin Portal Label */}
            <div className="px-3 py-2 rounded-xl bg-[var(--m-bg-surface)] border border-[var(--m-border)] mb-2">
              <p className="text-[10px] font-semibold text-[var(--m-accent)] uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm truncate
                      transition-all duration-150 cursor-pointer flex items-center gap-2.5
                      ${isActive
                        ? "bg-[var(--m-bg-hover)] text-[var(--m-text-primary)] border-l-2 border-[var(--m-accent)]"
                        : "text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-surface)] hover:text-[var(--m-text-primary)]"
                      }
                    `}
                  >
                    <span className={isActive ? "text-[var(--m-accent)]" : "text-[var(--m-text-muted)]"}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom: User Accounts Section — identical theme to main chat UI */}
          <div className="border-t border-[var(--m-border-subtle)] relative">
            {/* Account menu popup */}
            {showAccountMenu && (
              <div className="absolute bottom-full left-2 right-2 mb-1 bg-[var(--m-bg-surface)] border border-[var(--m-border)] rounded-xl shadow-xl shadow-black/30 overflow-hidden z-50">
                <div className="px-3 py-2.5 border-b border-[var(--m-border-subtle)]">
                  <p className="text-xs font-semibold text-[var(--m-text-primary)]">Admin</p>
                  <p className="text-[10px] text-[var(--m-text-muted)] mt-0.5">admin@meridian.local</p>
                </div>
                <a
                  href="/"
                  className="w-full text-left px-3 py-2 text-xs text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-hover)] hover:text-[var(--m-text-primary)] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Back to Chat
                </a>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    if (confirm("Log out of Admin Portal? This will clear browser credentials.")) {
                      window.location.href = "http://logout:logout@" + window.location.host + "/admin";
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--m-error)]/80 hover:bg-[var(--m-error)]/5 hover:text-[var(--m-error)] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}

            <div className="p-3">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--m-bg-surface)] transition-colors cursor-pointer group"
              >
                {/* Avatar — identical styling to chat UI */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--m-accent)]/30 to-[#7c5cfc]/30 flex items-center justify-center text-xs font-semibold text-[var(--m-text-secondary)] shrink-0">
                  A
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-[var(--m-text-primary)] truncate">
                    Admin
                  </p>
                  <p className="text-[10px] text-[var(--m-text-muted)]">
                    On-Premise
                  </p>
                </div>

                {/* Settings gear icon matching screenshot 1 */}
                <svg
                  className="w-4 h-4 text-[var(--m-text-muted)] group-hover:text-[var(--m-text-secondary)] transition-colors shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT — Same structure as chat page.tsx               */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* GradientWaves — full background behind the content area, always visible on admin */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <GradientWaves
            horizonColor="#0d0d1a"
            waveColor="#2d3a8c"
            crestColor="#7c5cfc"
            speed={0.5}
            amplitude={2.5}
            waveScale={0.5}
            waveRatio={0.85}
            swell={30}
            turbulence={15}
            tilt={1.15}
            zoom={1.0}
            height={5.5}
            fogDepth={18}
            detail="medium"
            brightness={0.9}
            opacity={0.35}
            mouseInteraction={true}
            parallaxStrength={0.3}
            grain={true}
            grainIntensity={0.03}
          />
        </div>

        {/* Header — Glassmorphism, identical to ChatHeader */}
        <header className="h-12 border-b border-[var(--m-border-subtle)] bg-[var(--m-bg-primary)]/80 backdrop-blur-xl px-4 md:px-5 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-[var(--m-bg-hover)] transition-colors cursor-pointer"
              title="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <a href="/" className="text-lg font-bold text-[var(--m-text-primary)] hover:text-[var(--m-accent)] transition-colors tracking-tight">Meridian</a>
              <span className="text-sm text-[var(--m-text-muted)] font-medium">/</span>
              <span className="text-lg font-bold text-[var(--m-text-secondary)] capitalize tracking-tight">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "documents" && (
              <button
                onClick={() => setShowUploadPanel(!showUploadPanel)}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--m-accent)] to-[#7c5cfc] text-xs font-bold text-white shadow-md shadow-[var(--m-accent)]/25 transition-all cursor-pointer"
              >
                {showUploadPanel ? "Close Upload" : "+ Upload PDF"}
              </button>
            )}
          </div>
        </header>

        {/* Content Area — scrollable, sits above GradientWaves */}
        <main className="flex-1 overflow-y-auto relative z-10 p-5 md:p-6">
          <div className="max-w-5xl w-full mx-auto space-y-6">
            {/* ============== DASHBOARD TAB ============== */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-[var(--m-text-primary)] mb-1.5 tracking-tight">Admin Dashboard</h1>
                  <p className="text-sm text-[var(--m-text-tertiary)] max-w-2xl">
                    Overview of ingested documents, operational rules, and backend system status.
                  </p>
                </div>

                <AdminAuth />

                {/* Metrics Grid — glassmorphism cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    onClick={() => setActiveTab("documents")}
                    className="bg-[var(--m-bg-secondary)]/70 backdrop-blur-xl border border-[var(--m-border)]/50 rounded-xl p-4 shadow-lg shadow-black/20 hover:border-[var(--m-accent)]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--m-text-tertiary)] group-hover:text-[var(--m-accent)] transition-colors">Ingested PDFs</span>
                      <div className="p-1.5 rounded-lg bg-[var(--m-accent)]/10 text-[var(--m-accent)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--m-text-primary)]">{documentList.length}</div>
                    <p className="text-[11px] text-[var(--m-accent)] font-medium mt-1">Active SOP manuals in ChromaDB</p>
                  </div>

                  <div
                    onClick={() => setActiveTab("rules")}
                    className="bg-[var(--m-bg-secondary)]/70 backdrop-blur-xl border border-[var(--m-border)]/50 rounded-xl p-4 shadow-lg shadow-black/20 hover:border-[#7c5cfc]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--m-text-tertiary)] group-hover:text-[#7c5cfc] transition-colors">Active Rules</span>
                      <div className="p-1.5 rounded-lg bg-[#7c5cfc]/10 text-[#7c5cfc]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--m-text-primary)]">4</div>
                    <p className="text-[11px] text-[#7c5cfc] font-medium mt-1">Rules enabled in rules.md</p>
                  </div>

                  <div className="bg-[var(--m-bg-secondary)]/70 backdrop-blur-xl border border-[var(--m-border)]/50 rounded-xl p-4 shadow-lg shadow-black/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[var(--m-text-tertiary)]">FastAPI Backend</span>
                      <div className="p-1.5 rounded-lg bg-[var(--m-success)]/10 text-[var(--m-success)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-[var(--m-text-primary)] truncate">{backendService || "FastAPI Server"}</div>
                    <p className="text-[11px] text-[var(--m-success)] font-medium mt-1">Status: {healthStatus}</p>
                  </div>
                </div>

                {/* Workspaces & Capabilities — perfectly aligned grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quick Workspaces Card */}
                  <div className="bg-[var(--m-bg-secondary)]/70 backdrop-blur-xl border border-[var(--m-border)]/50 rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--m-text-primary)] mb-3.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[var(--m-accent)]" />
                      Quick Workspaces
                    </h3>
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <button
                        onClick={() => setActiveTab("documents")}
                        className="w-full p-3.5 rounded-xl bg-[var(--m-bg-surface)]/50 hover:bg-[var(--m-bg-hover)]/60 border border-[var(--m-border)]/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-xs font-bold text-[var(--m-accent)] mb-1">Documents Workspace</p>
                          <p className="text-[11px] text-[var(--m-text-tertiary)] leading-relaxed">Ingest PDF operating procedures or manage library.</p>
                        </div>
                        <span className="text-xs font-semibold text-[var(--m-accent)] shrink-0 group-hover:translate-x-1 transition-transform">Open →</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("rules")}
                        className="w-full p-3.5 rounded-xl bg-[var(--m-bg-surface)]/50 hover:bg-[var(--m-bg-hover)]/60 border border-[var(--m-border)]/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-xs font-bold text-[#7c5cfc] mb-1">Rules Workspace</p>
                          <p className="text-[11px] text-[var(--m-text-tertiary)] leading-relaxed">Configure prompt injected rules in rules.md.</p>
                        </div>
                        <span className="text-xs font-semibold text-[#7c5cfc] shrink-0 group-hover:translate-x-1 transition-transform">Open →</span>
                      </button>
                    </div>
                  </div>

                  {/* System Capabilities Card */}
                  <div className="bg-[var(--m-bg-secondary)]/70 backdrop-blur-xl border border-[var(--m-border)]/50 rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--m-text-primary)] mb-3.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[var(--m-accent)]" />
                      System Capabilities
                    </h3>
                    <div className="space-y-3 flex-1 flex flex-col justify-between text-xs text-[var(--m-text-tertiary)]">
                      <div className="p-3.5 rounded-xl bg-[var(--m-bg-surface)]/50 border border-[var(--m-border)]/40 flex-1 flex flex-col justify-center">
                        <span className="font-bold text-[var(--m-accent)] block text-xs mb-1">Ollama Local Inference</span>
                        <p className="text-[11px] text-[var(--m-text-tertiary)] leading-relaxed">
                          Local quantized LLM models (llama3:8b / phi3) with zero external API dependencies.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[var(--m-bg-surface)]/50 border border-[var(--m-border)]/40 flex-1 flex flex-col justify-center">
                        <span className="font-bold text-[#7c5cfc] block text-xs mb-1">Data Analysis Executor</span>
                        <p className="text-[11px] text-[var(--m-text-tertiary)] leading-relaxed">
                          Native exec() runner with automatic 3-attempt retry loop and Matplotlib chart generation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============== DOCUMENTS TAB ============== */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-[var(--m-text-primary)] mb-1.5 tracking-tight">Documents</h1>
                  <p className="text-sm text-[var(--m-text-tertiary)] max-w-2xl">
                    Manage ingested SOP documents and ChromaDB vector store embeddings.
                  </p>
                </div>

                {showUploadPanel && (
                  <DocumentUpload
                    onUploadSuccess={handleDocumentUploaded}
                    onCancel={() => setShowUploadPanel(false)}
                  />
                )}

                <DocumentList documents={documentList} onDeleteDocument={handleDocumentDeleted} />
              </div>
            )}

            {/* ============== RULES TAB ============== */}
            {activeTab === "rules" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-[var(--m-text-primary)] mb-1.5 tracking-tight">Rules</h1>
                  <p className="text-sm text-[var(--m-text-tertiary)] max-w-2xl">
                    Manage operational behavior rules defined in rules.md configuration.
                  </p>
                </div>

                <RulesEditor />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
