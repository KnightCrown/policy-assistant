import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse, ErrorResponse } from "@/types/chat";
import { computeMetrics } from "@/lib/metrics";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";

const SYSTEM_PROMPT = `You are a helpful policy analysis assistant for development projects. Provide concise, structured answers suitable for World Bank style policy notes. Always respond in clear English, in 2 to 4 short paragraphs, optionally with bullet points.

IMPORTANT: At the end of your response, include a section titled "## Sources" and list the full URLs of the sources you used or referred to. Ensure the URLs are valid and accessible. If you don't have specific URLs, list the names of the reports or organizations.`;

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json<ErrorResponse>(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }

    // Build OpenAI chat messages array
    const openAIMessages = [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT,
      },
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    // Call OpenAI API
    const openAIResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: openAIMessages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      }
    );

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json<ErrorResponse>(
        {
          error: "Failed to get response from the policy assistant. Please try again.",
        },
        { status: 500 }
      );
    }

    const openAIData = await openAIResponse.json();
    const assistantContent =
      openAIData.choices?.[0]?.message?.content || "No response generated.";

    // Compute metrics
    const metrics = computeMetrics(assistantContent);

    // Build response
    const response: ChatResponse = {
      assistantMessage: {
        role: "assistant",
        content: assistantContent,
      },
      metrics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json<ErrorResponse>(
      { error: "Something went wrong talking to the policy assistant." },
      { status: 500 }
    );
  }
}
