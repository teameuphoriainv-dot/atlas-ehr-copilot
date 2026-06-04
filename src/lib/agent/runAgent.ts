import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicEnv } from "@/lib/env";
import { FHIR_TOOLS, buildAgentSystemPrompt } from "./fhirTools";
import { sanitize, sanitizeBundle } from "./sanitize";
import type { FhirClient } from "@/lib/fhir/remote";

export interface ProposedAction {
  resourceType: string;
  summary: string;
  resource: Record<string, unknown>;
}

export interface AgentTurn {
  reply: string;
  proposedActions: ProposedAction[];
  toolLog: string[]; // human-readable trace for the UI
}

type Msg = Anthropic.MessageParam;

/**
 * Run one agent turn: a bounded tool-use loop. Reads auto-execute (sanitized into
 * context); writes are collected as proposed actions for clinician confirmation.
 */
export async function runAgent(opts: {
  message: string;
  history?: Msg[];
  patientRef: string;
  fhir: FhirClient;
}): Promise<AgentTurn> {
  const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = getAnthropicEnv();
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const messages: Msg[] = [
    ...(opts.history ?? []),
    { role: "user", content: opts.message },
  ];
  const proposedActions: ProposedAction[] = [];
  const toolLog: string[] = [];

  for (let round = 0; round < 6; round++) {
    const resp = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      system: buildAgentSystemPrompt(opts.patientRef),
      tools: FHIR_TOOLS,
      messages,
    });

    const toolUses = resp.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (toolUses.length === 0) {
      const reply = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { reply, proposedActions, toolLog };
    }

    messages.push({ role: "assistant", content: resp.content });
    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const tu of toolUses) {
      const input = tu.input as Record<string, unknown>;
      try {
        if (tu.name === "search_fhir") {
          const rt = String(input.resourceType);
          const q = String(input.query ?? "");
          toolLog.push(`search ${rt} ${q}`);
          const data = await opts.fhir.search(rt, q);
          results.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(sanitizeBundle(data)).slice(0, 9000),
          });
        } else if (tu.name === "read_fhir") {
          const rt = String(input.resourceType);
          const id = String(input.id);
          toolLog.push(`read ${rt}/${id}`);
          const data = await opts.fhir.read(rt, id);
          results.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(sanitize(data)).slice(0, 6000),
          });
        } else if (tu.name === "propose_write") {
          const action: ProposedAction = {
            resourceType: String(input.resourceType),
            summary: String(input.summary ?? ""),
            resource: (input.resource as Record<string, unknown>) ?? {},
          };
          proposedActions.push(action);
          toolLog.push(`propose ${action.resourceType}: ${action.summary}`);
          results.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: "Queued for clinician confirmation. NOT yet written.",
          });
        } else {
          results.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: `Unknown tool: ${tu.name}`,
            is_error: true,
          });
        }
      } catch (e) {
        results.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: `Error: ${e instanceof Error ? e.message : String(e)}`,
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: results });
  }

  return {
    reply: "I gathered a lot but hit the step limit — ask me to continue.",
    proposedActions,
    toolLog,
  };
}
