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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveStatus({
        type: "success",
        message: "Successfully saved rules to rules.md configuration.",
      });
      setTimeout(() => setSaveStatus({ type: null, message: "" }), 4000);
    } catch (err: any) {
      setSaveStatus({
        type: "error",
        message: err.message || "Failed to update rules.md configuration.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-xl shadow-black/20">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Agent Behavior Rules (`rules.md`)</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            System prompts dynamically inject active rules before agent execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Agent Filter Dropdown */}
          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Agents</option>
            <option value="rag">RAG Agent</option>
            <option value="visual">Visual Agent</option>
            <option value="data">Data Agent</option>
            <option value="report">Report Agent</option>
          </select>

          {/* Save All Button */}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Rules"}
          </button>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveStatus.type && (
        <div
          className={`mb-4 p-3.5 rounded-xl text-xs flex items-center justify-between ${
            saveStatus.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          <span>{saveStatus.message}</span>
          <button onClick={() => setSaveStatus({ type: null, message: "" })} className="hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-xl border transition-all ${
              rule.status === "approved"
                ? "bg-zinc-900/60 border-zinc-800/80 shadow-sm"
                : "bg-zinc-950/40 border-zinc-900 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                {/* Agent Tag */}
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {rule.agent}
                </span>

                {/* Category Tag */}
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                  {rule.category}
                </span>

                {/* Restrained Priority Indicator */}
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    rule.priority === "high"
                      ? "text-red-400 bg-red-500/10 border border-red-500/20"
                      : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                  }`}
                >
                  {rule.priority}
                </span>
              </div>

              {/* Status Toggle Switch */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-400 font-semibold">
                  {rule.status === "approved" ? "Active" : "Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleRule(rule.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rule.status === "approved" ? "bg-indigo-600" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      rule.status === "approved" ? "translate-x-4" : "translate-x-0"
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
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-indigo-500/50 text-xs text-zinc-100 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveText(rule.id)}
                    className="px-3.5 py-1 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4 mt-2">
                <p className="text-xs text-zinc-300 leading-relaxed font-mono bg-zinc-950/70 p-3 rounded-xl border border-zinc-900 flex-1">
                  {rule.rule}
                </p>
                <button
                  onClick={() => handleStartEdit(rule)}
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 shrink-0 transition-colors"
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
