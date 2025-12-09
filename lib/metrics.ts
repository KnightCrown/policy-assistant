import { Metrics, MetricDetail } from "@/types/chat";

/**
 * Computes Evidence Strength and Implementation Complexity metrics
 * based on heuristics applied to the AI assistant's response text.
 */
export function computeMetrics(answer: string): Metrics {
  const evidenceStrength = computeEvidenceStrength(answer);
  const implementationComplexity = computeImplementationComplexity(answer);

  return {
    evidenceStrength,
    implementationComplexity,
  };
}

function computeEvidenceStrength(answer: string): MetricDetail {
  const lowerAnswer = answer.toLowerCase();
  let score = 30; // Base score

  // Extract sources if present (looking for "## Sources" section or similar)
  const sources: string[] = [];
  // Matches ## Sources, ### Sources, **Sources**, or just Sources: at the end
  const sourceSectionRegex = /(?:##|###|\*\*|Sources:)\s*Sources?([\s\S]*)$/i;
  const match = answer.match(sourceSectionRegex);

  if (match && match[1]) {
    const sourceText = match[1];
    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    const urls = sourceText.match(urlRegex);
    if (urls) {
      sources.push(...urls);
      score += 15; // Bonus for having explicit sources
    }
  }

  // Word count bonus
  const wordCount = answer.split(/\s+/).length;
  if (wordCount > 150) {
    score += 10;
  }

  // Evidence-related keywords
  const evidenceKeywords = [
    "evidence",
    "data",
    "study",
    "studies",
    "evaluation",
    "rct",
    "randomized",
    "systematic review",
    "case study",
    "research",
    "findings",
    "analysis",
    "meta-analysis",
  ];

  let keywordMatches = 0;
  evidenceKeywords.forEach((keyword) => {
    if (lowerAnswer.includes(keyword)) {
      keywordMatches++;
      score += 5;
    }
  });

  // Numbers or percentages bonus
  const hasNumbers = /\d+%|\d+\.\d+%|\d+/.test(answer);
  if (hasNumbers) {
    score += 5;
  }

  // Citations or references
  if (
    lowerAnswer.includes("according to") ||
    lowerAnswer.includes("research shows") ||
    lowerAnswer.includes("studies indicate")
  ) {
    score += 10;
  }

  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine label
  let label: "Low" | "Moderate" | "High";
  if (score < 40) {
    label = "Low";
  } else if (score < 70) {
    label = "Moderate";
  } else {
    label = "High";
  }

  // Build rationale
  let rationale = "";
  if (keywordMatches > 3 && hasNumbers) {
    rationale =
      "Mentions multiple studies and includes data or statistics with concrete examples.";
  } else if (keywordMatches > 0 && hasNumbers) {
    rationale = "References some evidence and includes quantitative information.";
  } else if (keywordMatches > 0) {
    rationale = "Mentions evidence or research but lacks specific data.";
  } else {
    rationale =
      "Provides general guidance without citing specific evidence or data sources.";
  }

  return { score, label, rationale, sources: sources.length > 0 ? sources : undefined };
}

function computeImplementationComplexity(answer: string): MetricDetail {
  const lowerAnswer = answer.toLowerCase();
  let score = 40; // Base score

  // Complexity-increasing factors
  const complexityKeywords = [
    "regulation",
    "legislation",
    "legal framework",
    "policy reform",
    "coordination",
    "across ministries",
    "interagency",
    "multi-stakeholder",
    "stakeholder",
    "infrastructure",
    "capacity gap",
    "long-term investment",
    "institutional",
    "systemic change",
    "governance",
  ];

  let complexityMatches = 0;
  complexityKeywords.forEach((keyword) => {
    if (lowerAnswer.includes(keyword)) {
      complexityMatches++;
      score += 6;
    }
  });

  // Complexity-decreasing factors
  const simplicityKeywords = [
    "pilot",
    "small-scale",
    "incremental",
    "quick win",
    "low-cost",
    "straightforward",
    "simple",
    "easy to implement",
  ];

  let simplicityMatches = 0;
  simplicityKeywords.forEach((keyword) => {
    if (lowerAnswer.includes(keyword)) {
      simplicityMatches++;
      score -= 8;
    }
  });

  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine label
  let label: "Low" | "Medium" | "High";
  if (score < 40) {
    label = "Low";
  } else if (score < 70) {
    label = "Medium";
  } else {
    label = "High";
  }

  // Build rationale
  let rationale = "";
  if (complexityMatches > 2 && simplicityMatches === 0) {
    rationale =
      "Requires cross-ministry coordination and legal changes, increasing complexity.";
  } else if (complexityMatches > 0 && simplicityMatches === 0) {
    rationale =
      "Involves institutional or regulatory changes that add moderate complexity.";
  } else if (simplicityMatches > complexityMatches) {
    rationale =
      "Focuses on small-scale pilots and incremental improvements, keeping complexity low.";
  } else if (simplicityMatches > 0) {
    rationale =
      "Balances some complex elements with practical, incremental approaches.";
  } else {
    rationale =
      "Standard implementation approach with typical organizational requirements.";
  }

  return { score, label, rationale };
}
