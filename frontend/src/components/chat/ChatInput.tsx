"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  deepResearchEnabled: boolean;
  onToggleDeepResearch: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  deepResearchEnabled,
  onToggleDeepResearch,
  disabled = false,
  placeholder = "Message Meridian...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed, attachedFiles.length > 0 ? attachedFiles : undefined);
    setValue("");
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasContent = value.trim().length > 0 || attachedFiles.length > 0;

  return (
    <div className="px-4 pb-4 pt-2">
      <div
        className={`
          flex flex-col gap-3
          bg-[var(--m-bg-input)]/90 backdrop-blur-xl border border-[var(--m-border)]
          rounded-2xl px-5 py-4
          transition-all duration-200 shadow-lg shadow-black/20
          ${disabled ? "opacity-60" : ""}
          focus-within:border-[var(--m-accent)]/40
        `}
      >
        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-1">
            {attachedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--m-bg-surface)] border border-[var(--m-border)] text-xs group"
              >
                {/* File icon */}
                <svg className="w-3.5 h-3.5 text-[var(--m-accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-[var(--m-text-secondary)] font-medium max-w-[120px] truncate">{file.name}</span>
                <span className="text-[var(--m-text-muted)]">{formatFileSize(file.size)}</span>
                {/* Remove button */}
                <button
                  onClick={() => removeFile(i)}
                  className="p-0.5 rounded text-[var(--m-text-muted)] hover:text-[var(--m-error)] transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="
            w-full bg-transparent text-[var(--m-text-primary)] text-sm
            placeholder:text-[var(--m-text-muted)] resize-none outline-none
            leading-relaxed max-h-[200px]
          "
        />

        {/* Bottom bar: toggle + actions */}
        <div className="flex items-center justify-between">
          {/* Left: Deep Research toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDeepResearch}
              disabled={disabled}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 cursor-pointer select-none
                ${
                  deepResearchEnabled
                    ? "bg-[var(--m-accent)] text-white shadow-md shadow-[var(--m-accent)]/20"
                    : "bg-[var(--m-bg-surface)] text-[var(--m-text-tertiary)] border border-[var(--m-border)] hover:text-[var(--m-text-secondary)] hover:border-[var(--m-accent)]/30"
                }
              `}
              title="Toggle Deep Research mode"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span>Deep Research</span>
            </button>
          </div>

          {/* Right: Attach + Send */}
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.csv,.json,.png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-1.5 rounded-lg text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)] hover:bg-[var(--m-bg-surface)] transition-all cursor-pointer"
              title="Attach file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={disabled || !hasContent}
              className={`
                p-2 rounded-full transition-all duration-200
                ${
                  hasContent && !disabled
                    ? "bg-[var(--m-accent)] text-white send-btn-active cursor-pointer"
                    : "bg-[var(--m-bg-surface)] text-[var(--m-text-muted)] cursor-not-allowed"
                }
              `}
              title="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-[var(--m-text-muted)] text-center mt-2">
        Meridian runs entirely on-premise. No data leaves this machine.
      </p>
    </div>
  );
}
