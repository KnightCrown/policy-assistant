"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import {
  Message,
  Metrics,
  ChatResponse,
  ErrorResponse,
  Conversation,
} from "@/types/chat";
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Search,
  RefreshCw,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Example prompts that rotate randomly
const EXAMPLE_PROMPTS = [
  "What are low-cost ways to improve digital ID uptake among rural women in low-income countries?",
  "If a government wants to expand cash transfer programs quickly, what early implementation steps should they prioritize?",
  "What are the main risks to consider when launching an e-government service without strong local digital capacity?",
  "How can a country in a fragile, conflict-affected setting strengthen its public financial management systems?",
];

export default function Home() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTechStack, setShowTechStack] = useState(false);
  const [currentExamplePrompt, setCurrentExamplePrompt] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set random example prompt on mount and when new chat is created
  useEffect(() => {
    const randomPrompt = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    setCurrentExamplePrompt(randomPrompt);
  }, [currentConversationId]);

  // Load conversations from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("policy-prompt-conversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) {
          // Load the most recent conversation
          const mostRecent = parsed.sort(
            (a: Conversation, b: Conversation) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          loadConversation(mostRecent);
        } else {
          createNewChat();
        }
      } catch (e) {
        console.error("Failed to parse conversations", e);
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // Save conversations to local storage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(
        "policy-prompt-conversations",
        JSON.stringify(conversations)
      );
    }
  }, [conversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, metrics]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const createNewChat = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      metrics: null,
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    loadConversation(newConv);
  };

  const loadConversation = (conv: Conversation) => {
    setCurrentConversationId(conv.id);
    setMessages(conv.messages);
    setMetrics(conv.metrics);
    setError(null);
    // Close sidebar on mobile when a conversation is selected
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newConvs = conversations.filter((c) => c.id !== id);
    setConversations(newConvs);
    localStorage.setItem(
      "policy-prompt-conversations",
      JSON.stringify(newConvs)
    );

    if (currentConversationId === id) {
      if (newConvs.length > 0) {
        loadConversation(newConvs[0]);
      } else {
        createNewChat();
      }
    }
  };

  const updateCurrentConversation = (
    newMessages: Message[],
    newMetrics: Metrics | null
  ) => {
    if (!currentConversationId) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentConversationId) {
          // Generate a title from the first user message if it's "New Conversation"
          let title = c.title;
          if (
            c.title === "New Conversation" &&
            newMessages.length > 0 &&
            newMessages[0].role === "user"
          ) {
            title = newMessages[0].content.slice(0, 30) + "...";
          }
          return {
            ...c,
            messages: newMessages,
            metrics: newMetrics,
            title,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setError(null);
    setIsLoading(true);

    // Update conversation state immediately with user message
    updateCurrentConversation(updatedMessages, metrics);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
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

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      setMetrics(data.metrics);
      updateCurrentConversation(finalMessages, data.metrics);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return;

    let messagesToSend = [...messages];
    
    // If the last message is from the assistant, remove it to regenerate
    if (messagesToSend[messagesToSend.length - 1].role === "assistant") {
      messagesToSend = messagesToSend.slice(0, -1);
    }
    
    // If there are no messages left, return
    if (messagesToSend.length === 0) return;

    // The last message should now be a user message
    const lastUserMessage = messagesToSend[messagesToSend.length - 1];
    if (lastUserMessage.role !== "user") return;

    setMessages(messagesToSend);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend.map((msg) => ({
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

      const finalMessages = [...messagesToSend, assistantMessage];
      setMessages(finalMessages);
      setMetrics(data.metrics);
      updateCurrentConversation(finalMessages, data.metrics);
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
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans text-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 relative">
              <Image
                src="/ppmLogo2.png"
                alt="Policy Assistant Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className={`font-bold text-xl tracking-tight text-gray-800 ${inter.className}`}>
              Policy Assistant
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createNewChat}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              New chat
            </button>
            <button
              onClick={() => setShowTechStack(true)}
              className="flex-none w-[52px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-sm hover:shadow-md"
            >
              <Info size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Your conversations
          </div>
          {conversations.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-4">
              No conversations yet
            </div>
          )}
          {conversations
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
            .map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv)}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  currentConversationId === conv.id
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <MessageSquare
                  size={18}
                  className={
                    currentConversationId === conv.id
                      ? "text-blue-600"
                      : "text-gray-400"
                  }
                />
                <span className="flex-1 truncate text-sm font-medium">
                  {conv.title}
                </span>
                <button
                  onClick={(e) => deleteConversation(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded-md transition-all"
                  title="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>

        {/* Sidebar Footer (Settings placeholder) */}
        <div className="p-4 border-t border-gray-100">
          <div 
            onClick={() => setShowTechStack(true)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer text-gray-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#155dfc] flex items-center justify-center relative overflow-hidden">
              <Image
                src="/ppmLogo-white.png"
                alt="Policy Assistant Logo"
                fill
                className="object-contain p-1.5"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Policy Assistant</p>
              <p className="text-xs text-gray-400">v1.3.2</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image
                src="/ppmLogo2.png"
                alt="Policy Assistant Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className={`font-bold text-lg text-gray-800 ${inter.className}`}>
              Policy Assistant
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 relative overflow-hidden">
                  <Image
                    src="/ppmLogo2.png"
                    alt="Policy Assistant Logo"
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">
                  How can I help with your policy analysis?
                </h2>
                <p className="text-gray-500 max-w-lg">
                  Example: {currentExamplePrompt}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-1 relative overflow-hidden">
                      <Image
                        src="/ppmLogo-white.png"
                        alt="Bot"
                        fill
                        className="object-contain p-1.5"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-6 py-4 shadow-sm ${
                      message.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-semibold prose-h3:text-lg prose-p:leading-relaxed prose-li:marker:text-blue-500">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-1 relative overflow-hidden">
                  <Image
                    src="/ppmLogo-white.png"
                    alt="Bot"
                    fill
                    className="object-contain p-1.5"
                  />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    Analyzing policy data...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mx-auto max-w-md bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {/* Metrics Panel (Always at bottom of chat) */}
            {metrics && !isLoading && (
              <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                    Analysis Metrics
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <MetricItem
                    title="Evidence Strength"
                    metric={metrics.evidenceStrength}
                    color="blue"
                  />
                  <MetricItem
                    title="Implementation Complexity"
                    metric={metrics.implementationComplexity}
                    color="purple"
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6] to-transparent">
          <div className="max-w-3xl mx-auto">
            {messages.length > 0 && !isLoading && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-2 text-sm text-blue-600 bg-white px-4 py-2 rounded-full shadow-sm border border-blue-100 hover:bg-blue-50 transition-colors"
                >
                  <RefreshCw size={14} />
                  Regenerate response
                </button>
              </div>
            )}

            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="What's on your mind?"
                rows={1}
                className="w-full bg-transparent px-6 py-4 pr-16 text-gray-800 placeholder-gray-400 focus:outline-none resize-none max-h-48 overflow-y-auto"
                style={{ minHeight: "60px" }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-md hover:shadow-lg disabled:shadow-none"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              Policy Assistant can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </div>
      </main>

      {/* Tech Stack Modal */}
      {showTechStack && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowTechStack(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 relative overflow-hidden">
                <Image
                  src="/ppmLogo2.png"
                  alt="Policy Assistant Logo"
                  fill
                  className="object-contain p-2"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Tech Stack</h3>
                <p className="text-sm text-gray-500">Policy Assistant v1.3.2</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                Policy Assistant is a lightweight conversational tool that turns policy questions into clear, structured AI responses.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                It is supported by simple evidence and complexity scores. And provides links to sources where possible (if provided by chat gpt)
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Frontend</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700">Next.js 14</span>
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700">React</span>
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700">TypeScript</span>
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700">Tailwind CSS</span>
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700">Lucide Icons</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Model</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-50 border border-blue-100 rounded-md text-xs font-medium text-blue-700">OpenAI GPT-5 Nano</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Deployment</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700">Vercel</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Built by KnightCrown
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricItem({
  title,
  metric,
  color,
}: {
  title: string;
  metric: Metrics["evidenceStrength"];
  color: "blue" | "purple";
}) {
  const [showSources, setShowSources] = useState(false);

  const colorClasses = {
    blue: {
      bg: "bg-blue-100",
      bar: "bg-blue-500",
      text: "text-blue-700",
    },
    purple: {
      bg: "bg-purple-100",
      bar: "bg-purple-500",
      text: "text-purple-700",
    },
  };
  const colors = colorClasses[color];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-700">{title}</span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-md ${colors.bg} ${colors.text}`}
        >
          {metric.label}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900">{metric.score}</span>
        <span className="text-sm text-gray-400 mb-1">/100</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${metric.score}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 leading-relaxed border-l-2 border-gray-200 pl-3 mt-2">
        {metric.rationale}
      </p>

      {metric.sources && metric.sources.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showSources ? (
              <>
                Hide Evidence <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                View Evidence <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
          
          {showSources && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-100 text-xs space-y-1">
              <p className="font-semibold text-gray-700 mb-2">Sources:</p>
              <ul className="space-y-1">
                {metric.sources.map((source, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                    <a 
                      href={source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

