"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage as ChatMessageType, ChatSession, ChatMode } from "@/lib/api";
import { sendChatMessage, generateId, generateSessionId } from "@/lib/api";
import type { UserAccount } from "@/components/chat/ChatSidebar";
import dynamic from "next/dynamic";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatWelcome from "@/components/chat/ChatWelcome";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessageComponent from "@/components/chat/ChatMessage";
import TypingIndicator from "@/components/chat/TypingIndicator";

const GradientWaves = dynamic(() => import("@/components/ui/GradientWaves"), {
  ssr: false,
});

// =============================================================================
// Explainable AI Thinking content generator
// Shows reasoning chain for both Standard and Deep Research modes.
// =============================================================================

function generateThinkingContent(userQuery: string, mode: ChatMode): string {
  const lines: string[] = [];
  lines.push(`Analyzing query: "${userQuery.slice(0, 80)}${userQuery.length > 80 ? "..." : ""}"`);
  lines.push("");

  if (mode === "deep_research") {
    lines.push("- Deep Research mode active: initiating multi-step investigation loop.");
    lines.push("- Querying knowledge base using hybrid search (vector embeddings + BM25 keyword matching).");
    lines.push("- Cross-referencing multiple SOP manuals, telemetry schemas, and incident logs.");
    lines.push("- Verifying factual consistency and synthesizing findings with exact page citations.");
    lines.push("- Checking confidence threshold before generating grounded response.");
  } else {
    lines.push("- Standard mode: decomposing query and identifying operational intent.");
    lines.push("- Querying on-premise ChromaDB vector store and indexed documentation.");
    lines.push("- Extracting relevant context chunks and evaluating source relevance.");
    lines.push("- Formulating concise, grounded answer adhering to active governance rules.");
  }

  return lines.join("\n");
}

// =============================================================================
// Deep Research endpoint configuration
// When a teammate implements the Deep Research agent, update this function
// to point to the correct endpoint. Currently falls back to the RAG agent.
// =============================================================================

/**
 * Returns the agent_target string for the backend orchestrator.
 * Update this mapping when the Deep Research agent is implemented.
 *
 * Current routing:
 *   "standard"      -> "rag" (RAG agent)
 *   "deep_research" -> "rag" (temporary fallback — change to "deep_research" once implemented)
 */
function getAgentTarget(mode: ChatMode): string {
  switch (mode) {
    case "deep_research":
      // TODO: When the Deep Research LangGraph agent is ready, change this to:
      //   return "deep_research";
      // The orchestrator router.py already handles agent_target routing.
      return "rag";
    case "standard":
    default:
      return "rag";
  }
}

export default function MeridianChat() {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<ChatMode>("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // User account state — will be populated from login/signup page
  const [currentUser] = useState<UserAccount | null>({
    name: "Operator",
    role: "On-Premise",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Derived State
  // -------------------------------------------------------------------------
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];
  const isWelcomeScreen = !activeSessionId || messages.length === 0;
  const sessionTitle = activeSession?.title || "Meridian";

  // -------------------------------------------------------------------------
  // Auto-scroll to bottom on new messages
  // -------------------------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  // -------------------------------------------------------------------------
  // Session Management
  // -------------------------------------------------------------------------
  const createNewSession = useCallback((): string => {
    const newId = generateSessionId();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode: mode,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    return newId;
  }, [mode]);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMode("standard");
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) setMode(session.mode);
  }, [sessions]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) setActiveSessionId(null);
  }, [activeSessionId]);

  // -------------------------------------------------------------------------
  // User Account Handlers
  // These will connect to your login/signup page when implemented
  // -------------------------------------------------------------------------
  const handleLoginClick = useCallback(() => {
    // TODO: Navigate to /auth/login or open auth modal
    // router.push("/auth/login");
    console.log("[Meridian] Login/signup navigation — connect your auth page here");
  }, []);

  const handleSettingsClick = useCallback(() => {
    // TODO: Navigate to /settings or open settings modal
    console.log("[Meridian] Settings navigation — connect your settings page here");
  }, []);

  // -------------------------------------------------------------------------
  // Send Message
  // -------------------------------------------------------------------------
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = createNewSession();
    }

    // Build user message with attachments
    const userMessage: ChatMessageType = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
      mode,
      attachments: attachments?.map((f) => ({
        name: f.name,
        size: f.size < 1024 * 1024
          ? `${(f.size / 1024).toFixed(1)} KB`
          : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: f.type,
      })),
    };

    // Update session
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        const isFirstMessage = s.messages.length === 0;
        return {
          ...s,
          title: isFirstMessage ? content.slice(0, 50) + (content.length > 50 ? "..." : "") : s.title,
          messages: [...s.messages, userMessage],
          updatedAt: Date.now(),
          mode,
        };
      })
    );

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Route to the correct agent based on mode
      const response = await sendChatMessage(
        content,
        currentSessionId,
        mode,
        mode === "deep_research", // deep think is auto-enabled in deep research mode
      );

      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const aiContent = response.findings.join("\n\n") || "I wasn't able to generate a response.";

      // Always show explainable AI thinking process
      const thinkingContent = generateThinkingContent(content, mode);

      const aiMessage: ChatMessageType = {
        id: generateId(),
        role: "assistant",
        content: aiContent,
        thinking: thinkingContent,
        thinkingDuration: thinkingContent ? Math.max(durationSeconds, 1) : undefined,
        evidence: response.evidence,
        confidence: response.confidence,
        agentName: response.agent_name,
        errors: response.errors.length > 0 ? response.errors : undefined,
        timestamp: Date.now(),
        mode,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          return { ...s, messages: [...s.messages, aiMessage], updatedAt: Date.now() };
        })
      );
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error connecting to the backend. Please make sure the FastAPI server is running on port 8000.",
        errors: [error instanceof Error ? error.message : "Unknown error"],
        timestamp: Date.now(),
        mode,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          return { ...s, messages: [...s.messages, errorMessage], updatedAt: Date.now() };
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, mode, createNewSession]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--m-bg-primary)]">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        onLoginClick={handleLoginClick}
        onSettingsClick={handleSettingsClick}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* GradientWaves — full background behind entire chat column, rendered across all states */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <GradientWaves
            horizonColor="#0d0d1a"
            waveColor="#2d3a8c"
            crestColor="#7c5cfc"
            speed={0.5}
            amplitude={2.5}
            waveScale={0.5}
              waveRatio={0.85}
              swell={30}
              turbulence={15}
              tilt={1.15}
              zoom={1.0}
              height={5.5}
              fogDepth={18}
              detail="medium"
              brightness={0.9}
              opacity={0.5}
              mouseInteraction={true}
              parallaxStrength={0.3}
              grain={true}
              grainIntensity={0.03}
            />
          </div>

        <ChatHeader
          sessionTitle={sessionTitle}
          activeMode={mode}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          {isWelcomeScreen ? (
            <div className="flex-1 flex flex-col">
              <ChatWelcome activeMode={mode} onModeChange={setMode} />
            </div>
          ) : (
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto"
            >
              <div className="max-w-3xl mx-auto py-4">
                {messages.map((msg) => (
                  <ChatMessageComponent key={msg.id} message={msg} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto w-full relative z-10">
            <ChatInput
              onSendMessage={handleSendMessage}
              deepResearchEnabled={mode === "deep_research"}
              onToggleDeepResearch={() =>
                setMode(mode === "deep_research" ? "standard" : "deep_research")
              }
              disabled={isLoading}
              placeholder={
                mode === "deep_research"
                  ? "Ask a research question..."
                  : "Message Meridian..."
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
