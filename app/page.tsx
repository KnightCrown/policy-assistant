"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { Message, Metrics, ChatResponse, ErrorResponse } from "@/types/chat";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
      createdAt: new Date().toISOString(),
    };

    // Add user message and clear input
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data: ChatResponse = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.assistantMessage.content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setMetrics(data.metrics);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as FormEvent);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            PolicyPrompt Mini
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Quick AI briefs for policy questions
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
        {/* Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-4"
        >
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-12">
              <p className="text-lg">Ask a policy question to get started</p>
              <p className="text-sm mt-2">
                Example: &quot;What are effective interventions to reduce
                maternal mortality?&quot;
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-2 ${
                    message.role === "user"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div
              className="flex justify-start"
              role="status"
              aria-live="polite"
              aria-label="Assistant is thinking"
            >
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    Assistant is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-800">
              <p className="text-sm font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Metrics Panel */}
        {metrics ? (
          <div className="bg-white border-t border-gray-200 px-4 py-6 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Analysis Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Evidence Strength */}
                <MetricCard
                  title="Evidence Strength"
                  metric={metrics.evidenceStrength}
                  color="blue"
                />
                {/* Implementation Complexity */}
                <MetricCard
                  title="Implementation Complexity"
                  metric={metrics.implementationComplexity}
                  color="purple"
                />
              </div>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <div className="bg-white border-t border-gray-200 px-4 py-6 sm:px-6">
            <div className="max-w-4xl mx-auto text-center text-gray-500">
              <p className="text-sm">
                Metrics will appear here after the assistant responds
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border-t border-gray-200 px-4 py-6 sm:px-6">
            <div className="max-w-4xl mx-auto text-center text-gray-500">
              <p className="text-sm">
                Ask a question to see evidence and complexity scores here.
              </p>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="flex gap-2">
              <label htmlFor="message-input" className="sr-only">
                Your policy question
              </label>
              <textarea
                id="message-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask a policy question..."
                rows={2}
                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  metric: {
    score: number;
    label: string;
    rationale: string;
  };
  color: "blue" | "purple";
}

function MetricCard({ title, metric, color }: MetricCardProps) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-100",
      bar: "bg-blue-600",
      badge: "bg-blue-100 text-blue-800",
    },
    purple: {
      bg: "bg-purple-100",
      bar: "bg-purple-600",
      badge: "bg-purple-100 text-purple-800",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${colors.badge}`}
        >
          {metric.label}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl font-bold text-gray-900">
            {metric.score}
          </span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>
        
        <div className={`w-full ${colors.bg} rounded-full h-2.5`}>
          <div
            className={`${colors.bar} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${metric.score}%` }}
          ></div>
        </div>
      </div>
      
      <p className="text-xs text-gray-600 leading-relaxed">
        {metric.rationale}
      </p>
    </div>
  );
}

