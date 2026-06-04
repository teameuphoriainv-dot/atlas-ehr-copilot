import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicEnv } from "@/lib/env";
import { buildSystemPrompt, buildUserMessage } from "./prompt";
import { SUBMIT_ORDERS_TOOL } from "./tools";
import type { DraftOrder, ModelContext } from "@/lib/types";

export interface DraftResult {
  drafts: DraftOrder[];
  narration: string;
}

/**
 * Call Claude with tool-use to map a natural-language request + coded context
 * into structured draft orders. Server-only. PHI never enters here — only ModelContext.
 */
export async function draftOrders(
  text: string,
  ctx: ModelContext,
): Promise<DraftResult> {
  const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = getAnthropicEnv();
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    system: buildSystemPrompt(),
    tools: [SUBMIT_ORDERS_TOOL],
    tool_choice: { type: "tool", name: "submit_orders" },
    messages: [{ role: "user", content: buildUserMessage(text, ctx) }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Model did not return structured orders");
  }

  const input = toolUse.input as {
    narration?: string;
    drafts?: DraftOrder[];
  };

  return {
    narration: input.narration ?? "",
    drafts: Array.isArray(input.drafts) ? input.drafts : [],
  };
}
