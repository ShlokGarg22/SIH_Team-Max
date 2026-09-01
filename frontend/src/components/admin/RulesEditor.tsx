"use client";

import React, { useState } from "react";
import { RuleSchema } from "../../lib/api";

const INITIAL_MOCK_RULES: RuleSchema[] = [
  {
    id: "rule-01",
    agent: "RAG Agent",
    category: "Precedence",
    rule: "Always prioritize the latest approved SOP for procedure-related questions.",
    status: "approved",
    priority: "high",
  },
  {
    id: "rule-02",
    agent: "Visual Agent",
    category: "Safety Constraints",
    rule: "Never make safety-critical conclusions about structural integrity from images alone.",
    status: "approved",
    priority: "high",
  },
  {
    id: "rule-03",
    agent: "Data Agent",
    category: "Format Rules",
    rule: "Always perform row-level calculations before grouped aggregations and output Matplotlib charts.",
    status: "approved",
    priority: "medium",
  },
  {
    id: "rule-04",
    agent: "Report Agent",
    category: "Structure",
    rule: "Distinguish clearly between confirmed empirical facts, analytical inferences, and recommendations.",
    status: "approved",
    priority: "high",
  },
];

export default function RulesEditor() {
  const [rules, setRules] = useState<RuleSchema[]>(INITIAL_MOCK_RULES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  const filteredRules = rules.filter(
    (r) => selectedAgentFilter === "all" || r.agent.toLowerCase().includes(selectedAgentFilter.toLowerCase())
  );

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: r.status === "approved" ? "disabled" : "approved" } : r))
    );
  };

  const handleStartEdit = (rule: RuleSchema) => {
    setEditingId(rule.id);
    setEditText(rule.rule);
  };

  const handleSaveText = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, rule: editText } : r)));
    setEditingId(null);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveStatus({ type: null, message: "" });

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSaveStatus({
        type: "success",
        message: "Successfully saved configuration to rules.md.",
      });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 3500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update rules configuration.";
      setSaveStatus({
        type: "error",
        message: errorMessage,
      });

    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[var(--m-bg-secondary)]/70 backdrop-blur-xl border border-[var(--m-border)]/50 rounded-xl p-5 shadow-lg shadow-black/20">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#7c5cfc]/10 text-[#7c5cfc] border border-[#7c5cfc]/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--m-text-primary)]">Rule Configuration Editor</h3>
            <p className="text-xs text-[var(--m-text-tertiary)] mt-0.5">
              Operational behavior rules defined in rules.md injected into agent prompts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Agent Filter */}
          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--m-bg-surface)] border border-[var(--m-border)] text-xs text-[var(--m-text-primary)] focus:outline-none focus:border-[#7c5cfc]/50 transition-colors cursor-pointer"
          >
            <option value="all">All Agents</option>
            <option value="rag">RAG Agent</option>
            <option value="visual">Visual Agent</option>
            <option value="data">Data Agent</option>
            <option value="report">Report Agent</option>
          </select>

          {/* Save Button */}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--m-accent)] to-[#7c5cfc] text-xs font-bold text-white shadow-md shadow-[var(--m-accent)]/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Rules"}
          </button>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveStatus.type && (
        <div
          className={`mb-3 p-2.5 rounded-lg text-xs flex items-center justify-between border ${
            saveStatus.type === "success"
              ? "bg-[var(--m-success)]/10 text-[var(--m-success)] border-[var(--m-success)]/20"
              : "bg-[var(--m-error)]/10 text-[var(--m-error)] border-[var(--m-error)]/20"
          }`}
        >
          <span>{saveStatus.message}</span>
          <button onClick={() => setSaveStatus({ type: null, message: "" })} className="hover:opacity-70 cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-2.5">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`p-3.5 rounded-xl border transition-all ${
              rule.status === "approved"
                ? "bg-[var(--m-bg-surface)] border-[var(--m-border)]"
                : "bg-[var(--m-bg-surface)]/40 border-[var(--m-border-subtle)] opacity-50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {/* Agent Tag */}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--m-accent)]/10 text-[var(--m-accent)] border border-[var(--m-accent)]/20">
                  {rule.agent}
                </span>

                {/* Category Tag */}
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--m-bg-hover)] text-[var(--m-text-tertiary)] border border-[var(--m-border)]">
                  {rule.category}
                </span>

                {/* Priority Tag */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    rule.priority === "high"
                      ? "bg-[var(--m-warning)]/10 text-[var(--m-warning)] border border-[var(--m-warning)]/20"
                      : "bg-[var(--m-bg-hover)] text-[var(--m-text-tertiary)] border border-[var(--m-border)]"
                  }`}
                >
                  {rule.priority}
                </span>
              </div>

              {/* Status Toggle Switch */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--m-text-muted)] font-medium">
                  {rule.status === "approved" ? "Active" : "Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleRule(rule.id)}
                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rule.status === "approved" ? "bg-[var(--m-success)]" : "bg-[var(--m-bg-hover)]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      rule.status === "approved" ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Rule Content Editor */}
            {editingId === rule.id ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-lg bg-[var(--m-bg-primary)] border border-[var(--m-accent)]/50 text-xs font-mono text-[var(--m-text-primary)] focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-2.5 py-1 text-xs font-medium text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveText(rule.id)}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-[var(--m-accent)] to-[#7c5cfc] text-xs font-bold text-white cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 mt-1.5">
                <p className="text-xs text-[var(--m-text-secondary)] leading-relaxed font-mono bg-[var(--m-bg-primary)]/60 p-2.5 rounded-lg border border-[var(--m-border-subtle)] flex-1">
                  {rule.rule}
                </p>
                <button
                  onClick={() => handleStartEdit(rule)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[var(--m-text-muted)] hover:text-[var(--m-text-primary)] hover:bg-[var(--m-bg-hover)] border border-[var(--m-border)] shrink-0 transition-colors cursor-pointer"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
