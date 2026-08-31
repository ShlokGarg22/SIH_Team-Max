"use client";

import React, { useEffect, useState } from "react";
import AdminSidebar, { AdminTab } from "../../components/admin/AdminSidebar";
import DocumentUpload from "../../components/admin/DocumentUpload";
import DocumentList, { DocumentRecord } from "../../components/admin/DocumentList";
import RulesEditor from "../../components/admin/RulesEditor";
import AdminAuth from "../../components/admin/AdminAuth";
import { checkHealth } from "../../lib/api";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<string>("Checking...");
  const [backendService, setBackendService] = useState<string>("");

  // Shared mock document state
  const [documentList, setDocumentList] = useState<DocumentRecord[]>([
    {
      id: 1,
      filename: "SOP-Refinery-Valve-Maintenance.pdf",
      size: "4.2 MB",
      uploaded_at: "2026-08-30 14:22",
      status: "indexed",
    },
    {
      id: 2,
      filename: "Emergency-Shutdown-Procedure-V4.pdf",
      size: "2.8 MB",
      uploaded_at: "2026-08-31 09:15",
      status: "indexed",
    },
    {
      id: 3,
      filename: "Safety-Compliance-Manual-2026.pdf",
      size: "8.1 MB",
      uploaded_at: "2026-08-31 16:40",
      status: "indexed",
    },
  ]);

  useEffect(() => {
    // Check backend FastAPI server health on mount
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

  return (
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        healthStatus={healthStatus}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        {/* Mobile Header Bar */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950 px-6 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-sm font-bold text-white capitalize tracking-wider uppercase">
              {activeTab} Management
            </h2>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              healthStatus === "Connected"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                healthStatus === "Connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {healthStatus}
          </span>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {/* ------------------------------------------------------------------- */}
          {/* TAB 1: DASHBOARD VIEW */}
          {/* ------------------------------------------------------------------- */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header Title Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Admin Dashboard</h2>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    Sovereign On-Premise AI Workbench administration console. Manage SOP documents, agent behavior rules, and model settings.
                  </p>
                </div>
              </div>

              {/* Basic Auth Banner */}
              <AdminAuth />

              {/* Status Overview Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ingested PDFs Card */}
                <div
                  onClick={() => setActiveTab("documents")}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-5 shadow-xl shadow-black/20 hover:border-zinc-700/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">Ingested PDFs</span>
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-white">{documentList.length}</div>
                  <p className="text-[11px] text-zinc-500 mt-1">Active SOP manuals in ChromaDB</p>
                </div>

                {/* Active Rules Card */}
                <div
                  onClick={() => setActiveTab("rules")}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-5 shadow-xl shadow-black/20 hover:border-zinc-700/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">Active Rules</span>
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-white">4</div>
                  <p className="text-[11px] text-zinc-500 mt-1">Rules enabled in `rules.md`</p>
                </div>

                {/* Disabled Rules Card */}
                <div
                  onClick={() => setActiveTab("rules")}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-5 shadow-xl shadow-black/20 hover:border-zinc-700/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">Disabled Rules</span>
                    <span className="p-2 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-white">0</div>
                  <p className="text-[11px] text-zinc-500 mt-1">Rules currently bypassed</p>
                </div>

                {/* API Status Card */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-5 shadow-xl shadow-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-400">FastAPI Backend</span>
                    <span
                      className={`p-2 rounded-xl border ${
                        healthStatus === "Connected"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white truncate">{backendService || "FastAPI API"}</div>
                  <p className="text-[11px] text-zinc-500 mt-1">Status: {healthStatus}</p>
                </div>
              </div>

              {/* System Architecture Overview & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Navigation Card */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-xl shadow-black/20">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("documents")}
                      className="w-full p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                          Manage Documents
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Upload new PDF manuals or delete vector embeddings.</p>
                      </div>
                      <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                        Open →
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab("rules")}
                      className="w-full p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                          Manage Agent Rules
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Edit self-improvement rules in rules.md.</p>
                      </div>
                      <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                        Open →
                      </span>
                    </button>
                  </div>
                </div>

                {/* System Capabilities Overview Card */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-xl shadow-black/20">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4">System Architecture</h3>
                  <div className="space-y-3 text-xs text-zinc-400">
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                      <span className="font-semibold text-indigo-400 block mb-0.5">Ollama Local Inference</span>
                      <p className="text-[11px] leading-relaxed">
                        Executes local quantized LLMs (`llama3:8b` / `phi3`) with zero external API dependencies.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                      <span className="font-semibold text-indigo-400 block mb-0.5">Data Analysis Engine</span>
                      <p className="text-[11px] leading-relaxed">
                        Native `exec()` executor with 3-attempt retry loop and Matplotlib chart generation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* TAB 2: DOCUMENTS VIEW */}
          {/* ------------------------------------------------------------------- */}
          {activeTab === "documents" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <DocumentUpload onUploadSuccess={handleDocumentUploaded} />
              <DocumentList documents={documentList} onDeleteDocument={handleDocumentDeleted} />
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* TAB 3: RULES VIEW */}
          {/* ------------------------------------------------------------------- */}
          {activeTab === "rules" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <RulesEditor />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
