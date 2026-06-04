import { z } from "zod";

/**
 * Server-side environment. Access ONLY from server code (API routes, server components).
 * ANTHROPIC_API_KEY must never reach the client.
 */
const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  FHIR_BASE_URL: z.string().url().default("https://hapi.fhir.org/baseR4"),
  DEMO_PATIENT_ID: z.string().optional(),
});

let cached: z.infer<typeof serverSchema> | null = null;

export function getServerEnv() {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Invalid server environment. Check .env.local — ${issues}`,
    );
  }
  cached = parsed.data;
  return cached;
}

/** Public, client-safe flags (NEXT_PUBLIC_*). */
export const publicEnv = {
  useMockFhir: process.env.NEXT_PUBLIC_USE_MOCK_FHIR === "true",
};
