/**
 * Narrow FHIR R4 types — only the fields Atlas reads/writes.
 * (We keep our own narrow types rather than leaning on the full @types/fhir surface,
 *  so the code is robust and self-documenting.)
 */

export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Reference {
  reference?: string; // e.g. "Patient/123"
  display?: string;
}

export interface HumanName {
  text?: string;
  family?: string;
  given?: string[];
}

export interface FhirPatient {
  resourceType: "Patient";
  id?: string;
  name?: HumanName[];
  gender?: string;
  birthDate?: string; // YYYY-MM-DD
}

export interface FhirCondition {
  resourceType: "Condition";
  id?: string;
  code?: CodeableConcept;
  clinicalStatus?: CodeableConcept;
  subject?: Reference;
}

export interface FhirMedication {
  // Covers MedicationStatement and MedicationRequest (medicationCodeableConcept shape)
  resourceType: "MedicationStatement" | "MedicationRequest";
  id?: string;
  status?: string;
  intent?: string;
  medicationCodeableConcept?: CodeableConcept;
  subject?: Reference;
}

export interface FhirAllergyIntolerance {
  resourceType: "AllergyIntolerance";
  id?: string;
  code?: CodeableConcept;
  patient?: Reference;
}

export interface FhirServiceRequest {
  resourceType: "ServiceRequest";
  id?: string;
  status: string;
  intent: string;
  subject: Reference;
  code?: CodeableConcept;
}

export interface FhirMedicationRequest {
  resourceType: "MedicationRequest";
  id?: string;
  status: string;
  intent: string;
  subject: Reference;
  medicationCodeableConcept?: CodeableConcept;
  dosageInstruction?: { text?: string }[];
}

export interface BundleEntry<T> {
  resource?: T;
}

export interface Bundle<T> {
  resourceType: "Bundle";
  entry?: BundleEntry<T>[];
  total?: number;
}
