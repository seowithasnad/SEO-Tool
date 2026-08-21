import { getAnthropicClient } from "./client";

export interface ContentAnalysis {
  keywordDensityPercent: number;
  semanticCoverage: { covered: string[]; missing: string[] };
  entityCoverage: { covered: string[]; missing: string[] };
  missingQuestions: string[];
  searchIntent: string;
  intentMatch: "matches" | "partial" | "mismatch";
  readabilityScore: number;
  readabilityNotes: string;
  eeatScore: number;
  eeatNotes: string[];
  seoScore: number;
  aiSearchVisibilityScore: number;
  llmScores: {
    googleAiOverview: number;
    chatgpt: number;
    claude: number;
    gemini: number;
    perplexity: number;
  };
  topRecommendations: string[];
}

export async function analyzeContent(params: {
  targetKeyword: string;
  body: string;
  userClaudeKey?: string | null;
}): Promise<ContentAnalysis> {
  const client = getAnthropicClient(params.userClaudeKey);

  // Cap the draft length sent to the model — long articles cost more without
  // adding analysis quality beyond a representative excerpt.
  const truncated = params.body.slice(0, 12000);

  const prompt = `You are an SEO editor scoring a draft article against the target keyword "${params.targetKeyword}".

Article draft:
"""
${truncated}
"""

Respond with ONLY a JSON object (no markdown fences, no preamble) matching this exact shape:

{
  "keywordDensityPercent": number (target keyword occurrences as % of total words, one decimal),
  "semanticCoverage": { "covered": string[], "missing": string[] } (semantic/related terms an article on this topic should include),
  "entityCoverage": { "covered": string[], "missing": string[] },
  "missingQuestions": string[] (questions readers would expect answered that this draft doesn't cover),
  "searchIntent": string (the likely intent behind this keyword),
  "intentMatch": "matches" | "partial" | "mismatch" (does the draft's content match that intent),
  "readabilityScore": number (0-100, higher = easier to read),
  "readabilityNotes": string,
  "eeatScore": number (0-100),
  "eeatNotes": string[],
  "seoScore": number (0-100, overall),
  "aiSearchVisibilityScore": number (0-100, likelihood of being cited by AI answer engines),
  "llmScores": {
    "googleAiOverview": number (0-100),
    "chatgpt": number (0-100),
    "claude": number (0-100),
    "gemini": number (0-100),
    "perplexity": number (0-100)
  },
  "topRecommendations": string[] (3-6 concrete, prioritized fixes)
}

Base every score and note on what's actually in the draft above — don't invent claims about it.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude.");
  }

  const cleaned = textBlock.text.trim().replace(/^```json\n?|```$/g, "");
  return JSON.parse(cleaned) as ContentAnalysis;
}
