import OpenAI from "openai";

// One shared client. Key comes from the environment (Railway env var) and never
// touches the browser — all OpenAI calls happen in server-side route handlers.
// Fallback keeps the constructor from throwing at import/build time when the key
// is absent; real requests are gated by assertOpenAIConfigured() below.
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "sk-not-configured" });

// Models are env-configurable so they can be bumped without a code change.
// As of build time the current OpenAI vision/chat models are gpt-5.2 and gpt-5.5.
export const VISION_MODEL = process.env.OPENAI_VISION_MODEL ?? "gpt-5.2";
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-5.2";

export function assertOpenAIConfigured() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set. Add it to your environment (Railway variable / .env).");
  }
}
