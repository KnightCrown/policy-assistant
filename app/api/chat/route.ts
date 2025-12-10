import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse, ErrorResponse } from "@/types/chat";
import { computeMetrics } from "@/lib/metrics";
import { validateAndFilterLinks } from "@/lib/linkValidator";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";

const SYSTEM_PROMPT = `You are a helpful policy analysis assistant for development projects. Provide concise, structured answers suitable for World Bank style policy notes. Always respond in clear English, in 2 to 4 short paragraphs, optionally with bullet points.

IMPORTANT CITATION GUIDELINES:
1. Include in-text citations at the end of every major paragraph or point where you reference information from sources
2. Format citations as [Source Name, Year] or [Organization, Year] immediately after the relevant point
3. For bullet points with multiple sub-points, add a citation at the end of each major point if applicable
4. At the end of your response, include a section titled "## Sources" and list the full URLs or detailed references of the sources you cited
5. Ensure citations are specific and correspond to actual sources when possible
6. CRITICAL: Only provide URLs that you are confident are valid and working. Avoid fabricating or guessing URLs. If you cannot provide a working URL, provide the full title, author, organization, and year instead of a broken link
7. When citing reports or publications, use generic organization URLs (e.g., https://www.worldbank.org or https://www.undp.org) rather than specific document URLs unless you are certain the link is correct

Example format:
- Point 1 discusses topic A with supporting data [World Bank, 2023].
- Point 2 covers topic B with evidence [UNDP, 2022].

## Sources
- World Bank (2023). Report Title. URL or detailed reference
- UNDP (2022). Report Title. URL or detailed reference`;


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

    // Validate and filter broken links (disabled for performance)
    // const filteredContent = await validateAndFilterLinks(assistantContent);

    // Get the user's last message to check if it's a substantive question
    const lastUserMessage = messages[messages.length - 1];
    const isSubstantiveQuestion = checkIfSubstantiveQuestion(lastUserMessage.content);

    // Compute metrics only for substantive questions
    const metrics = isSubstantiveQuestion ? computeMetrics(assistantContent) : null;

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

/**
 * Determines if a user message is a substantive question that warrants analysis metrics.
 * Returns false for greetings, simple acknowledgments, or very short messages.
 */
function checkIfSubstantiveQuestion(message: string): boolean {
  const trimmed = message.trim().toLowerCase();
  
  // Too short to be substantive (less than 10 characters)
  if (trimmed.length < 10) {
    return false;
  }
  
  // Common greetings and simple responses
  const simplePatterns = [
    /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|bye|goodbye)$/i,
    /^(hi there|hello there|good morning|good afternoon|good evening)$/i,
    /^thanks?( you)?( very much)?( a lot)?!*$/i,
    /^(ok|okay|sure|alright|got it|i see|nice|cool|great)!*$/i,
  ];
  
  for (const pattern of simplePatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }
  
  // Check for question words or policy-relevant keywords
  const substantiveIndicators = [
    'what', 'how', 'why', 'when', 'where', 'who', 'which',
    'can you', 'could you', 'would you',
    'policy', 'government', 'program', 'project', 'implement',
    'development', 'economic', 'social', 'reform', 'strategy',
    'challenge', 'risk', 'benefit', 'impact', 'effect',
    'suggest', 'recommend', 'advice', 'explain', 'analyze',
  ];
  
  const hasSubstantiveContent = substantiveIndicators.some(indicator => 
    trimmed.includes(indicator)
  );
  
  // Consider it substantive if it has indicators OR is reasonably long (30+ chars)
  return hasSubstantiveContent || trimmed.length >= 30;
}
