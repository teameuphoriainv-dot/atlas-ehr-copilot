import { getFhirEnv, publicEnv } from "@/lib/env";
import { mockGet, mockPost } from "@/mock/fhirServer";

/**
 * Thin server-side FHIR client over fetch. JSON in/out, clear errors.
 * Server-only — do not import from client components.
 */

export class FhirError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "FhirError";
  }
}

function base(): string {
  return getFhirEnv().FHIR_BASE_URL.replace(/\/$/, "");
}

/** GET a FHIR resource or search query. `path` is relative, e.g. "Patient/123" or "Condition?subject=Patient/123". */
export async function fhirGet<T>(path: string): Promise<T> {
  if (publicEnv.useMockFhir) return mockGet<T>(path);
  const res = await fetch(`${base()}/${path}`, {
    headers: { Accept: "application/fhir+json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new FhirError(`FHIR GET ${path} failed: ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

/** POST a new FHIR resource. Returns the created resource (with server-assigned id). */
export async function fhirPost<T>(resourceType: string, body: unknown): Promise<T> {
  if (publicEnv.useMockFhir) return mockPost<T>(resourceType, body);
  const res = await fetch(`${base()}/${resourceType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/fhir+json",
      Accept: "application/fhir+json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new FhirError(
      `FHIR POST ${resourceType} failed: ${res.status} ${detail.slice(0, 200)}`,
      res.status,
    );
  }
  return (await res.json()) as T;
}
