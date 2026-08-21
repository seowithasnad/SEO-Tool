import { getAnthropicClient } from "./client";
import type { SerpAiAnalysis } from "./analyze-serp";

export interface ContentBrief {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  outline: { h1: string; sections: { h2: string; h3s: string[] }[] };
  faqs: { question: string; answer: string }[];
  featuredSnippetAnswer: string;
  schema: { type: string; notes: string }[];
  internalLinkIdeas: string[];
  externalReferenceIdeas: string[];
  imageSuggestions: { altText: string; filename: string; caption: string }[];
  semanticKeywords: string[];
  entityList: string[];
  lsiKeywords: string[];
  eeatRecommendations: string[];
  aiEngineNotes: {
    googleAiOverview: string;
    chatgpt: string;
    claude: string;
    gemini: string;
    perplexity: string;
    copilot: string;
  };
  seoScore: number;
  eeatScore: number;
  aiSearchVisibilityScore: number;
}

export async function generateContentBrief(params: {
  keyword: string;
  serpContext?: Pick<
    SerpAiAnalysis,
    | "searchIntent"
    | "commonH2s"
    | "commonH3s"
    | "contentGaps"
    | "missingFaqs"
    | "entities"
  > | null;
  userClaudeKey?: string | null;
}): Promise<ContentBrief> {
  const client = getAnthropicClient(params.userClaudeKey);

  const contextBlock = params.serpContext
    ? `Existing SERP analysis for this keyword to build on (fill the gaps it identified, don't just repeat the competitors' structure):
${JSON.stringify(params.serpContext, null, 2)}`
    : "No prior SERP analysis is available — base the brief on general SEO best practice for this keyword.";

  const prompt = `You are an SEO content strategist writing a complete content brief for the target keyword "${params.keyword}".

${contextBlock}

Respond with ONLY a JSON object (no markdown fences, no preamble) matching this exact shape:

{
  "metaTitle": string (under 60 chars),
  "metaDescription": string (under 155 chars),
  "slug": string (kebab-case),
  "outline": {
    "h1": string,
    "sections": [ { "h2": string, "h3s": string[] } ]
  },
  "faqs": [ { "question": string, "answer": string (2-3 sentences) } ] (5-8 items),
  "featuredSnippetAnswer": string (40-60 words, directly answers the primary query),
  "schema": [ { "type": string (e.g. "Article", "FAQPage", "HowTo"), "notes": string } ],
  "internalLinkIdeas": string[] (anchor text ideas for internal links to related pages),
  "externalReferenceIdeas": string[] (types of authoritative external sources to cite),
  "imageSuggestions": [ { "altText": string, "filename": string (kebab-case, no extension), "caption": string } ] (3-5 items),
  "semanticKeywords": string[],
  "entityList": string[],
  "lsiKeywords": string[],
  "eeatRecommendations": string[] (concrete ways to demonstrate experience/expertise/authority/trust for this topic),
  "aiEngineNotes": {
    "googleAiOverview": string (one tactic to get cited),
    "chatgpt": string,
    "claude": string,
    "gemini": string,
    "perplexity": string,
    "copilot": string
  },
  "seoScore": number (0-100, projected score if this brief is executed well),
  "eeatScore": number (0-100),
  "aiSearchVisibilityScore": number (0-100)
}

Keep every string field concise and directly usable by a writer — no filler.`;

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
  return JSON.parse(cleaned) as ContentBrief;
}
