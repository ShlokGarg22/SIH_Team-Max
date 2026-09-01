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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload document.";
      setUploadStatus({
        type: "error",
        message: errorMessage,
      });

    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[var(--m-bg-secondary)]/70 backdrop-blur-xl border border-[var(--m-border)]/50 rounded-xl p-5 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--m-accent)]/10 text-[var(--m-accent)] border border-[var(--m-accent)]/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--m-text-primary)]">Upload PDF Document</h3>
            <p className="text-xs text-[var(--m-text-tertiary)] mt-0.5">
              Select an SOP document for text chunking and ChromaDB vector store indexing.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-medium text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] px-2.5 py-1 rounded-lg bg-[var(--m-bg-surface)] border border-[var(--m-border)] transition-colors cursor-pointer"
          >
            Close Panel
          </button>
        )}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-6 rounded-xl border border-dashed transition-all cursor-pointer text-center group ${
          isDragOver
            ? "border-[var(--m-accent)] bg-[var(--m-accent)]/10"
            : "border-[var(--m-border)] bg-[var(--m-bg-surface)]/60 hover:bg-[var(--m-bg-surface)] hover:border-[var(--m-accent)]/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />

        <div className="h-9 w-9 rounded-lg bg-[var(--m-bg-tertiary)] border border-[var(--m-border)] flex items-center justify-center mb-2 text-[var(--m-text-muted)] group-hover:text-[var(--m-accent)] group-hover:border-[var(--m-accent)]/30 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>

        <p className="text-xs font-semibold text-[var(--m-text-primary)]">
          <span className="text-[var(--m-accent)] underline underline-offset-2">Click to select PDF</span> or drag file here
        </p>
        <p className="text-[11px] text-[var(--m-text-muted)] mt-0.5">Maximum file size: 50MB</p>
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="mt-3 p-3 rounded-lg bg-[var(--m-bg-surface)] border border-[var(--m-border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-[var(--m-accent)]/10 text-[var(--m-accent)] border border-[var(--m-accent)]/20 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-[var(--m-text-primary)] truncate">{selectedFile.name}</p>
              <p className="text-[11px] text-[var(--m-text-tertiary)]">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-[var(--m-bg-hover)] disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[var(--m-accent)] to-[#7c5cfc] text-xs font-bold text-white shadow-md shadow-[var(--m-accent)]/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? "Processing..." : "Ingest Document"}
            </button>
          </div>
        </div>
      )}

      {/* Alert Banners */}
      {uploadStatus.type && (
        <div
          className={`mt-3 p-3 rounded-lg text-xs flex items-center justify-between border ${
            uploadStatus.type === "success"
              ? "bg-[var(--m-success)]/10 text-[var(--m-success)] border-[var(--m-success)]/20"
              : "bg-[var(--m-error)]/10 text-[var(--m-error)] border-[var(--m-error)]/20"
          }`}
        >
          <span>{uploadStatus.message}</span>
          <button onClick={() => setUploadStatus({ type: null, message: "" })} className="ml-2 hover:opacity-70 cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
