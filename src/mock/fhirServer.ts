/**
 * In-process mock FHIR server. Enabled with NEXT_PUBLIC_USE_MOCK_FHIR=true so the
 * demo survives a flaky/unreachable public sandbox. Serves one demo patient and
 * accepts order writes into an in-memory store. See docs/prd.md § Reliability.
 */
import type {
  Bundle,
  FhirAllergyIntolerance,
  FhirCondition,
  FhirMedication,
  FhirMedicationRequest,
  FhirPatient,
  FhirServiceRequest,
} from "@/lib/fhir/types";

const DEMO_ID = "mock-demo-1";

const patient: FhirPatient = {
  resourceType: "Patient",
  id: DEMO_ID,
  name: [{ text: "Riley Demo" }],
  gender: "female",
  birthDate: "1978-04-12",
};

const conditions: FhirCondition[] = [
  cc("Condition", "44054006", "http://snomed.info/sct", "Type 2 diabetes mellitus"),
  cc("Condition", "38341003", "http://snomed.info/sct", "Hypertension"),
  cc("Condition", "195967001", "http://snomed.info/sct", "Asthma"),
];

const medications: FhirMedication[] = [
  med("860975", "metformin 1000 mg oral tablet"),
  med("314076", "lisinopril 20 mg oral tablet"),
];

const allergies: FhirAllergyIntolerance[] = [
  {
    resourceType: "AllergyIntolerance",
    id: "a1",
    code: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "7980", display: "Penicillin" }],
      text: "Penicillin",
    },
  },
];

// Orders written during the session live here.
const orders: (FhirServiceRequest | FhirMedicationRequest)[] = [];
let seq = 1000;

export function isMockId(id: string): boolean {
  return id === DEMO_ID;
}
export const MOCK_DEMO_ID = DEMO_ID;

export function mockGet<T>(path: string): T {
  const [resource, query] = path.split("?");

  if (resource === `Patient/${DEMO_ID}`) return patient as T;
  if (resource === "Patient") return listBundle([patient]) as T;

  if (resource === "Condition") return listBundle(conditions) as T;
  if (resource === "MedicationStatement") return listBundle(medications) as T;
  if (resource === "AllergyIntolerance") return listBundle(allergies) as T;
  if (resource === "ServiceRequest")
    return listBundle(orders.filter((o) => o.resourceType === "ServiceRequest")) as T;
  if (resource === "MedicationRequest")
    return listBundle(orders.filter((o) => o.resourceType === "MedicationRequest")) as T;

  void query;
  return listBundle([]) as T;
}

export function mockPost<T>(resourceType: string, body: unknown): T {
  const resource = { ...(body as object), id: `mock-${seq++}` } as
    | FhirServiceRequest
    | FhirMedicationRequest;
  orders.push(resource);
  return resource as T;
}

function listBundle<T>(items: T[]): Bundle<T> {
  return { resourceType: "Bundle", entry: items.map((resource) => ({ resource })), total: items.length };
}

function cc(
  resourceType: "Condition",
  code: string,
  system: string,
  display: string,
): FhirCondition {
  return {
    resourceType,
    id: `c-${code}`,
    code: { coding: [{ system, code, display }], text: display },
  };
}

function med(code: string, display: string): FhirMedication {
  return {
    resourceType: "MedicationStatement",
    id: `m-${code}`,
    status: "active",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code, display }],
      text: display,
    },
  };
}
