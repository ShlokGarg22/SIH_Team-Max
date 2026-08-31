"use client";

import React, { useState, useRef } from "react";

interface DocumentUploadProps {
  onUploadSuccess?: (newDoc: { filename: string; size: string }) => void;
}

export default function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (file: File | null) => {
    setUploadStatus({ type: null, message: "" });
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setUploadStatus({
        type: "error",
        message: "Only PDF documents are supported for RAG vector store indexing.",
      });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus({ type: null, message: "" });

    try {
      // Mock upload delay simulating PDF chunking & vector embedding
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        filename: selectedFile.name,
        size: formatFileSize(selectedFile.size),
      };

      setUploadStatus({
        type: "success",
        message: `Successfully ingested "${selectedFile.name}". Vector embeddings generated.`,
      });

      if (onUploadSuccess) {
        onUploadSuccess(newDoc);
      }

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadStatus({
        type: "error",
        message: err.message || "Failed to upload document to server.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Ingest New SOP Document</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Upload PDF operating procedures for text chunking and ChromaDB vector store indexing.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
          PDF Format Only
        </span>
      </div>

      {/* Prominent Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer group ${
          isDragOver
            ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
            : "border-zinc-800/80 bg-zinc-900/40 hover:border-indigo-500/50 hover:bg-zinc-900/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />

        <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="text-xs font-semibold text-zinc-200">
          <span className="text-indigo-400 underline underline-offset-4">Click to select PDF</span> or drag file here
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">Maximum file size: 50MB</p>
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mt-4 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 border border-indigo-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-zinc-100 truncate">{selectedFile.name}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                "Ingest Document"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Alert Banner */}
      {uploadStatus.type && (
        <div
          className={`mt-4 p-3.5 rounded-xl text-xs flex items-center justify-between ${
            uploadStatus.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          <span>{uploadStatus.message}</span>
          <button onClick={() => setUploadStatus({ type: null, message: "" })} className="ml-2 hover:opacity-75">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
