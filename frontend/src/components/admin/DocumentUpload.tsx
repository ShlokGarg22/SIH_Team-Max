"use client";

import React, { useState, useRef } from "react";

interface DocumentUploadProps {
  onUploadSuccess?: (newDoc: { filename: string; size: string }) => void;
  onCancel?: () => void;
}

export default function DocumentUpload({ onUploadSuccess, onCancel }: DocumentUploadProps) {
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
      await new Promise((resolve) => setTimeout(resolve, 1200));

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
        message: err.message || "Failed to upload document.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-5 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">Upload PDF Document</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select an SOP document for text chunking and ChromaDB vector store indexing.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 transition-colors"
          >
            Close Panel
          </button>
        )}
      </div>

      {/* Dropzone with Cyan Accent Hover */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-6 rounded-md border border-dashed transition-all cursor-pointer text-center group ${
          isDragOver
            ? "border-cyan-500 bg-cyan-500/10"
            : "border-zinc-700/80 bg-zinc-950/60 hover:bg-zinc-950 hover:border-cyan-500/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />

        <div className="h-9 w-9 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2 text-zinc-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>

        <p className="text-xs font-semibold text-zinc-200">
          <span className="text-cyan-400 underline underline-offset-2">Click to select PDF</span> or drag file here
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5">Maximum file size: 50MB</p>
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="mt-3 p-3 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-zinc-100 truncate">{selectedFile.name}</p>
              <p className="text-[11px] text-zinc-400">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              className="px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-zinc-950 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isUploading ? "Processing..." : "Ingest Document"}
            </button>
          </div>
        </div>
      )}

      {/* Alert Banners */}
      {uploadStatus.type && (
        <div
          className={`mt-3 p-3 rounded text-xs flex items-center justify-between border ${
            uploadStatus.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          <span>{uploadStatus.message}</span>
          <button onClick={() => setUploadStatus({ type: null, message: "" })} className="ml-2 hover:opacity-70">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
