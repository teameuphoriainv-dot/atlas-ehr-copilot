import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPatientContext } from "@/lib/fhir/read";
import { toModelContext } from "@/lib/phi/isolate";
import { draftOrders } from "@/lib/agent/draftOrders";
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

  let modelContext;
  try {
    const ctx = await getPatientContext(patientId);
    // PHI-isolation boundary: only coded context crosses into the model.
    modelContext = toModelContext(ctx);
  } catch (e) {
    return NextResponse.json(
      { error: "FHIR read failed", details: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }

  try {
    const result = await draftOrders(text, modelContext);
    addAudit({
      patientRef: modelContext.patientRef,
      action: "drafted",
      orderSummaries: result.drafts.map((d) => d.display),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: "Model call failed", details: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
