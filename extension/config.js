// Atlas extension config. Loaded into the background service worker.
// The Non-Production Client ID is a sandbox identifier (not a secret) — safe to ship.
self.ATLAS_CONFIG = {
  // The Atlas backend (holds the Anthropic key, runs the agent loop).
  apiBase: "http://localhost:3000",

  // Epic R4 sandbox.
  fhirBaseUrl: "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
  clientId: "a6534435-15cf-4f76-ab7f-e163ce17c6d8",

  // Scopes — broad patient read + the writes Epic's sandbox allows (Condition/Observation/Allergy).
  scope:
    "openid fhirUser launch/patient offline_access patient/*.read patient/*.write",
};
