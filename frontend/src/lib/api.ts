// Frontend API client for Sovereign On-Premise Agentic AI Workbench

declare const process: { env?: Record<string, string | undefined> };

export const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000";

// -----------------------------------------------------------------------------
// TypeScript Interfaces (matching backend/schemas/agent.py)
// -----------------------------------------------------------------------------

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
  payload: Record<string, any>;
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

// -----------------------------------------------------------------------------
// Helper for HTTP Requests
// -----------------------------------------------------------------------------

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API Request failed (HTTP ${response.status}): ${errorText}`
    );
  }
  return response.json();
}

// -----------------------------------------------------------------------------
// Supported Backend API Functions
// -----------------------------------------------------------------------------

/**
 * Checks backend health status.
 * Target Endpoint: GET /health
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  const res = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<HealthCheckResponse>(res);
}

/**
 * Sends a standardized AgentRequest to the backend Orchestrator/Agents.
 * Target Endpoint: POST /api/agent/run
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

// -----------------------------------------------------------------------------
// Admin UI Backend Endpoint Status Note
// -----------------------------------------------------------------------------
// Currently, the following backend endpoints for Admin UI are pending backend creation:
// 1. POST /api/admin/upload (Document Upload)
// 2. GET /api/admin/documents (List Documents)
// 3. DELETE /api/admin/documents/{id} (Delete Document)
// 4. GET /api/admin/rules (Fetch Rules)
// 5. POST /api/admin/rules (Update Rules)
// Once implemented in backend/api/admin.py, corresponding client functions will be connected.
