import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export function getAnthropicClient(userKey?: string | null) {
  const key = userKey || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("No Claude API key configured (Settings or env).");
  return new Anthropic({ apiKey: key });
}

export function getOpenAiClient(userKey?: string | null) {
  const key = userKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("No OpenAI API key configured (Settings or env).");
  return new OpenAI({ apiKey: key });
}

export function getGeminiClient(userKey?: string | null) {
  const key = userKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("No Gemini API key configured (Settings or env).");
  return new GoogleGenerativeAI(key);
}
