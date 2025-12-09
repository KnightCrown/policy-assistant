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
  metrics: Metrics;
}

export interface ErrorResponse {
  error: string;
}
