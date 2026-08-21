import { getAnthropicClient } from "./client";

export interface SerpAiAnalysis {
  searchIntent: string;
  contentStructure: string;
  averageWordCount: number | null;
  commonH2s: string[];
  commonH3s: string[];
  entities: string[];
  nlpTerms: string[];
  semanticKeywords: string[];
  contentGaps: string[];
  missingFaqs: string[];
  missingSections: string[];
  eeatOpportunities: string[];
  internalLinkingIdeas: string[];
  externalReferences: string[];
  suggestedTables: string[];
  suggestedInfographics: string[];
  suggestedDiagrams: string[];
  schemaTypes: string[];
  contentScore: number;
  seoScore: number;
  aiSearchScore: number;
  googleAiModeScore: number;
  llmScore: number;
}

// Trim each organic result to the fields the model actually needs — keeps the
// prompt small and cheap regardless of how much raw JSON DataForSEO returns.
function summarizeResults(rawItems: any[]) {
  return rawItems.slice(0, 20).map((item, i) => ({
    rank: i + 1,
    title: item.title,
    url: item.url,
    description: item.description,
    domain: item.domain,
    word_count: item.word_count ?? null,
  }));
}

export async function analyzeSerp(params: {
  keyword: string;
  rawOrganicItems: any[];
  peopleAlsoAsk: string[];
  hasAiOverview: boolean;
  hasFeaturedSnippet: boolean;
  userClaudeKey?: string | null;
}): Promise<SerpAiAnalysis> {
  const client = getAnthropicClient(params.userClaudeKey);
  const results = summarizeResults(params.rawOrganicItems);

  const prompt = `You are an SEO strategist analyzing a Google SERP for the keyword "${params.keyword}".

Top ranking results (title, url, domain, description, word count where known):
${JSON.stringify(results, null, 2)}

People Also Ask questions: ${JSON.stringify(params.peopleAlsoAsk)}
AI Overview present: ${params.hasAiOverview}
Featured snippet present: ${params.hasFeaturedSnippet}

Analyze this SERP and respond with ONLY a JSON object (no markdown fences, no preamble) matching this exact shape:

{
  "searchIntent": string,
  "contentStructure": string,
  "averageWordCount": number | null,
  "commonH2s": string[],
  "commonH3s": string[],
  "entities": string[],
  "nlpTerms": string[],
  "semanticKeywords": string[],
  "contentGaps": string[],
  "missingFaqs": string[],
  "missingSections": string[],
  "eeatOpportunities": string[],
  "internalLinkingIdeas": string[],
  "externalReferences": string[],
  "suggestedTables": string[],
  "suggestedInfographics": string[],
  "suggestedDiagrams": string[],
  "schemaTypes": string[],
  "contentScore": number (0-100, how strong a well-optimized new article could score),
  "seoScore": number (0-100),
  "aiSearchScore": number (0-100, likelihood of being cited in AI Overviews/answer engines),
  "googleAiModeScore": number (0-100),
  "llmScore": number (0-100, general LLM-answer-engine friendliness)
}

Base every field on the actual titles, descriptions, and PAA questions above — do not invent facts about the domains. Keep each string array item concise (under 12 words).`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude.");
  }

  const cleaned = textBlock.text.trim().replace(/^```json\n?|```$/g, "");
  return JSON.parse(cleaned) as SerpAiAnalysis;
}
