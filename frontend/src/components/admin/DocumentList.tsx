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

    setStatusMessage(`Document "${filename}" deleted.`);
    setDeletingId(null);

    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-xl shadow-black/20">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Ingested Document Library</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Active SOP manuals embedded into ChromaDB vector database.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Delete Feedback Alert */}
      {statusMessage && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Document Table */}
      {filteredDocs.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">Document Name</th>
                <th className="px-4 py-3.5">Upload Date</th>
                <th className="px-4 py-3.5">Size</th>
                <th className="px-4 py-3.5">Vector Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-zinc-100 flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="truncate max-w-xs">{doc.filename}</span>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400">{doc.uploaded_at}</td>
                  <td className="px-4 py-3.5 text-zinc-400">{doc.size}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Indexed
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setDeletingId(doc.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all"
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
        <div className="p-10 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
          <svg className="w-10 h-10 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm font-bold text-zinc-200">No documents found</p>
          <p className="text-xs text-zinc-500 mt-1">Upload a PDF file above to add it to the RAG knowledge base.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h4 className="text-base font-bold text-white">Delete Document</h4>
            </div>

            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-100">
                "{docs.find((d) => d.id === deletingId)?.filename}"
              </span>
              ? This action will purge vector store embeddings from ChromaDB.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const target = docs.find((d) => d.id === deletingId);
                  if (target) handleDeleteConfirm(target.id, target.filename);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-500/20 transition-all"
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
