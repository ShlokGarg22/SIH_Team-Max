"use client";

import React, { useState } from "react";

export interface DocumentRecord {
  id: number;
  filename: string;
  size: string;
  uploaded_at: string;
  status: "indexed" | "processing" | "failed";
}

const INITIAL_MOCK_DOCUMENTS: DocumentRecord[] = [
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
];

interface DocumentListProps {
  documents?: DocumentRecord[];
  onDeleteDocument?: (id: number) => void;
}

export default function DocumentList({
  documents: externalDocs,
  onDeleteDocument,
}: DocumentListProps) {
  const [docs, setDocs] = useState<DocumentRecord[]>(externalDocs || INITIAL_MOCK_DOCUMENTS);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredDocs = docs.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteConfirm = (id: number, filename: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (onDeleteDocument) onDeleteDocument(id);

    setStatusMessage(`Document "${filename}" removed.`);
    setDeletingId(null);

    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-5 shadow-lg shadow-black/20">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">Document Library</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ingested operating procedures indexed in ChromaDB vector store.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-60">
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Alert Banner */}
      {statusMessage && (
        <div className="mb-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="hover:opacity-70">
            ✕
          </button>
        </div>
      )}

      {/* Dark Document Table */}
      {filteredDocs.length > 0 ? (
        <div className="overflow-x-auto rounded border border-zinc-800/80">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-3.5 py-2.5">Document Name</th>
                <th className="px-3.5 py-2.5">Upload Date</th>
                <th className="px-3.5 py-2.5">Size</th>
                <th className="px-3.5 py-2.5">Vector Status</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-900 transition-colors">
                  <td className="px-3.5 py-2.5 font-semibold text-zinc-100 flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate max-w-xs">{doc.filename}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-zinc-400">{doc.uploaded_at}</td>
                  <td className="px-3.5 py-2.5 text-zinc-400">{doc.size}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Indexed
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <button
                      onClick={() => setDeletingId(doc.id)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 text-center rounded border border-dashed border-zinc-800 bg-zinc-950/40">
          <svg className="w-8 h-8 text-zinc-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xs font-semibold text-zinc-200">No documents found</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Upload a PDF document to index it in the knowledge base.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-400 mb-2">
              <div className="p-1 rounded bg-red-500/10 border border-red-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-zinc-100">Delete Document</h4>
            </div>

            <p className="text-xs text-zinc-400 mb-5 leading-normal">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-200">
                &quot;{docs.find((d) => d.id === deletingId)?.filename}&quot;
              </span>

              ? This will remove its vector embeddings from ChromaDB.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const target = docs.find((d) => d.id === deletingId);
                  if (target) handleDeleteConfirm(target.id, target.filename);
                }}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-500/20 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
