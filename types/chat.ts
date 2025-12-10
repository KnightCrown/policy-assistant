export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface MetricDetail {
  score: number; // 0 to 100
  label: "Low" | "Moderate" | "High" | "Medium";
  rationale: string;
  sources?: string[];
}

export interface Metrics {
  evidenceStrength: MetricDetail;
  implementationComplexity: MetricDetail;
}

export interface ChatRequest {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
}

export interface ChatResponse {
  assistantMessage: {
    role: "assistant";
    content: string;
  };
  metrics: Metrics | null;
}

export interface ErrorResponse {
  error: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  metrics: Metrics | null;
  updatedAt: string;
}
