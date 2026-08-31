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
  const [showUploadPanel, setShowUploadPanel] = useState<boolean>(false);

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
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Component */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        healthStatus={healthStatus}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-200">
        {/* Top Header Application Bar */}
        <header className="h-13 border-b border-zinc-800 bg-zinc-950 px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-zinc-400 hover:text-white p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb Navigation */}
            <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <span>Admin</span>
              <span>/</span>
              <span className="text-zinc-100 capitalize font-bold">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Upload Button for Documents Tab */}
            {activeTab === "documents" && (
              <button
                onClick={() => setShowUploadPanel(!showUploadPanel)}
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-zinc-950 transition-all shadow-md shadow-cyan-500/20"
              >
                {showUploadPanel ? "Close Upload" : "+ Upload PDF"}
              </button>
            )}

            {/* FastAPI Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
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
              FastAPI: {healthStatus}
            </span>
          </div>
        </header>

        {/* Main Content Workspace Body */}
        <main className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 max-w-6xl w-full mx-auto">
          {/* ------------------------------------------------------------------- */}
          {/* TAB 1: DASHBOARD VIEW */}
          {/* ------------------------------------------------------------------- */}
          {activeTab === "dashboard" && (
            <div className="space-y-5">
              {/* Header Title */}
              <div>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Admin Dashboard</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Overview of ingested documents, operational rules, and backend system status.
                </p>
              </div>

              {/* Security Auth Status Banner */}
              <AdminAuth />

              {/* Color-Accented Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Documents Metric Card (Cyan Accent) */}
                <div
                  onClick={() => setActiveTab("documents")}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 shadow-lg shadow-black/20 hover:border-cyan-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400 group-hover:text-cyan-300 transition-colors">
                      Ingested PDFs
                    </span>
                    <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-zinc-100">{documentList.length}</div>
                  <p className="text-[11px] text-cyan-400 font-medium mt-1">Active SOP manuals in ChromaDB</p>
                </div>

                {/* Rules Metric Card (Violet Accent) */}
                <div
                  onClick={() => setActiveTab("rules")}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 shadow-lg shadow-black/20 hover:border-violet-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400 group-hover:text-violet-300 transition-colors">
                      Active Rules
                    </span>
                    <div className="p-1.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-zinc-100">4</div>
                  <p className="text-[11px] text-violet-400 font-medium mt-1">Rules enabled in `rules.md`</p>
                </div>

                {/* Backend Metric Card (Emerald Accent) */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400">FastAPI Backend</span>
                    <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-zinc-100 truncate">{backendService || "FastAPI Server"}</div>
                  <p className="text-[11px] text-emerald-400 font-medium mt-1">Status: {healthStatus}</p>
                </div>
              </div>

              {/* Structured System Architecture & Workspaces Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-5 shadow-lg shadow-black/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    Quick Workspaces
                  </h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => setActiveTab("documents")}
                      className="w-full p-3 rounded bg-zinc-950 hover:bg-zinc-950/80 border border-zinc-800 text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors">
                          Documents Workspace
                        </p>
                        <p className="text-[11px] text-zinc-400">Ingest PDF operating procedures or manage library.</p>
                      </div>
                      <span className="text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                        Open →
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab("rules")}
                      className="w-full p-3 rounded bg-zinc-950 hover:bg-zinc-950/80 border border-zinc-800 text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-zinc-100 group-hover:text-violet-400 transition-colors">
                          Rules Workspace
                        </p>
                        <p className="text-[11px] text-zinc-400">Configure prompt injected rules in rules.md.</p>
                      </div>
                      <span className="text-xs font-semibold text-violet-400 group-hover:translate-x-1 transition-transform">
                        Open →
                      </span>
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-5 shadow-lg shadow-black/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    System Capabilities
                  </h3>
                  <div className="space-y-2.5 text-xs text-zinc-400">
                    <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                      <span className="font-bold text-indigo-400 block mb-0.5">Ollama Local Inference</span>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Local quantized LLM models (`llama3:8b` / `phi3`) with zero external API dependencies.
                      </p>
                    </div>
                    <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                      <span className="font-bold text-cyan-400 block mb-0.5">Data Analysis Executor</span>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Native `exec()` runner with automatic 3-attempt retry loop and Matplotlib chart generation.
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
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Documents</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage ingested SOP documents and ChromaDB vector store embeddings.
                </p>
              </div>

              {/* Toggleable Upload Panel */}
              {showUploadPanel && (
                <DocumentUpload
                  onUploadSuccess={handleDocumentUploaded}
                  onCancel={() => setShowUploadPanel(false)}
                />
              )}

              {/* Main Document Table */}
              <DocumentList documents={documentList} onDeleteDocument={handleDocumentDeleted} />
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* TAB 3: RULES VIEW */}
          {/* ------------------------------------------------------------------- */}
          {activeTab === "rules" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Rules</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage operational behavior rules defined in rules.md configuration.
                </p>
              </div>

              <RulesEditor />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
