// Meridian — Frontend API Client
// Connects to the Sovereign AI Workbench FastAPI backend

declare const process: { env?: Record<string, string | undefined> };

export const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000";

// =============================================================================
// TypeScript Interfaces (matching backend/schemas/agent.py)
// =============================================================================

export interface Evidence {
  source: string;
  page?: number;
  chunk?: string;
  confidence?: number;
}

export interface AgentRequest {
  task_id: string;
  session_id: string;
  agent_target: string;
  payload: Record<string, unknown>;
  applied_rules?: Array<Record<string, string>>;
}

export interface AgentResponse {
  task_id: string;
  agent_name: string;
  status: "completed" | "failed" | "requires_user_input";
  findings: string[];
  evidence: Evidence[];
  confidence: number;
  errors: string[];
}

export interface RuleSchema {
  id: string;
  agent: string;
  category: string;
  rule: string;
  status: string;
  priority: string;
}

export interface DocumentItem {
  id: number;
  filename: string;
  file_path: string;
  uploaded_at: string;
  status: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
}

// =============================================================================
// Chat-Specific Types
// =============================================================================

export type ChatMode = "standard" | "deep_research";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string; // XAI reasoning content (Explainable AI / Deep Think)
  thinkingDuration?: number; // seconds the "thinking" took
  evidence?: Evidence[];
  confidence?: number;
  agentName?: string;
  errors?: string[];
  timestamp: number;
  mode: ChatMode;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  name: string;
  size: string;
  type: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  mode: ChatMode;
}

// =============================================================================
// Helper
// =============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API Request failed (HTTP ${response.status}): ${errorText}`
    );
  }
  return response.json();
}

// =============================================================================
// Backend API Functions
// =============================================================================

/**
 * Checks backend health status.
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  const res = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<HealthCheckResponse>(res);
}

/**
 * Sends a standardized AgentRequest to the backend Orchestrator.
 */
export async function runAgentTask(
  request: AgentRequest
): Promise<AgentResponse> {
  const res = await fetch(`${API_BASE_URL}/api/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<AgentResponse>(res);
}

/**
 * Sends a chat message through the orchestrator and returns the agent response.
 * Routes to the correct agent based on the current chat mode.
 */
export async function sendChatMessage(
  message: string,
  sessionId: string,
  mode: ChatMode = "standard",
  deepThinkEnabled: boolean = false,
): Promise<AgentResponse> {
  const taskId = `task_chat_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

  // Route to the appropriate agent based on mode
  const agentTarget = mode === "deep_research" ? "rag" : "rag";

  const request: AgentRequest = {
    task_id: taskId,
    session_id: sessionId,
    agent_target: agentTarget,
    payload: {
      query: message,
      prompt: message,
      mode: mode,
      deep_think: deepThinkEnabled,
      hybrid_search: true,
    },
  };

  return runAgentTask(request);
}

/**
 * Directly queries the RAG agent endpoint (bypasses orchestrator).
 */
export async function queryRAGAgent(
  query: string,
  hybridSearch: boolean = true,
  contextFiles?: string[],
): Promise<AgentResponse> {
  const res = await fetch(`${API_BASE_URL}/api/agents/rag/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      hybrid_search: hybridSearch,
      context_files: contextFiles || [],
    }),
  });
  return handleResponse<AgentResponse>(res);
}

// =============================================================================
// Utility: Generate unique IDs
// =============================================================================

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateSessionId(): string {
  return `session-${generateId()}`;
}
