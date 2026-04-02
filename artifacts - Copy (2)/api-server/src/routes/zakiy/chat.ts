import { openai } from "@workspace/integrations-openai-ai-server";
import type { ZakiyMemoryData } from "./types.js";
import { buildZakiySystemPrompt } from "./prompts.js";

export async function generateZakiyResponse(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  memory: ZakiyMemoryData
): Promise<string> {
  const systemPrompt = buildZakiySystemPrompt(memory);
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: userMessage },
  ];

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 900,
    messages,
  });

  return chatResponse.choices[0]?.message?.content ?? "";
}
