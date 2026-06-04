import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPatientContext } from "@/lib/fhir/read";
import { toModelContext } from "@/lib/phi/isolate";
import { draftOrdersStream } from "@/lib/agent/draftOrders";
import { addAudit } from "@/lib/audit/log";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  patientId: z.string().min(1),
  text: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Empty or invalid request", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { patientId, text } = parsed.data;

  // FHIR read + PHI isolation happen up front (not streamed). Errors return JSON.
  let modelContext;
  try {
    const ctx = await getPatientContext(patientId);
    modelContext = toModelContext(ctx);
  } catch (e) {
    return NextResponse.json(
      { error: "FHIR read failed", details: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }

  // Stream the model's narration, then send the final structured result.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      try {
        const result = await draftOrdersStream(text, modelContext, (narration) =>
          send("narration", { narration }),
        );
        addAudit({
          patientRef: modelContext.patientRef,
          action: "drafted",
          orderSummaries: result.drafts.map((d) => d.display),
        });
        send("result", result);
      } catch (e) {
        send("error", {
          error: "Model call failed",
          details: e instanceof Error ? e.message : String(e),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
