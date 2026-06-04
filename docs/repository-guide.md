# Repository Guide — Atlas

This document explains the repository from a contributor and reviewer perspective.

---

## 1. Repository purpose

Atlas is a hackathon-built EHR copilot prototype that demonstrates one core workflow:

**natural-language clinical intent → structured coded draft → explicit confirmation → FHIR write-back**

The repo is organized to keep trust-critical logic separated from display/UI logic.

---

## 2. High-level layout

```text
src/
├── app/            # routes, layout, server APIs
├── components/     # UI primitives and product features
├── lib/            # domain logic, FHIR, agent, PHI boundary, audit
└── mock/           # mock FHIR fallback
```

---

## 3. Key flows

### Patient context flow
1. user selects a patient
2. UI calls `/api/patient` or `/api/patients`
3. server reads FHIR resources
4. chart summary is rendered in the workspace

### Draft flow
1. user enters a natural-language order
2. UI calls `/api/draft`
3. server loads patient context
4. `toModelContext()` strips PHI-sensitive fields
5. Claude returns structured drafts via tool-use
6. UI renders draft cards + confirm panel

### Confirm/write flow
1. user clicks confirm
2. UI calls `/api/orders`
3. server re-validates the drafts
4. server writes FHIR resources
5. chart refreshes
6. audit log updates

---

## 4. Trust-critical files

### `src/lib/phi/isolate.ts`
Defines the PHI boundary for model-visible data.

### `src/lib/phi/isolate.test.ts`
Protects the boundary with an automated test.

### `src/lib/agent/draftOrders.ts`
Runs structured model drafting.

### `src/lib/fhir/write.ts`
Builds and writes confirmed FHIR resources.

### `src/lib/codes/vocabulary.ts`
Constrains the MVP’s draftable order set.

---

## 5. UI structure

### `src/components/ui/`
Reusable primitives:
- Button
- Input
- Card
- Badge
- Skeleton

### `src/components/features/`
Product surfaces such as:
- Workspace
- FloatingAtlas
- OrderPanel
- OrderInput
- DraftOrderCard
- ConfirmPanel
- ChartSummary
- AuditLog

---

## 6. API surface

### `/api/patient`
Returns chart context for one patient.

### `/api/patients`
Returns a lightweight list for selection.

### `/api/draft`
Drafts structured orders from natural language.

### `/api/orders`
Writes confirmed orders after re-validation.

### `/api/audit`
Returns the in-memory audit log.

---

## 7. Extension folder

The `extension/` directory contains a Chrome extension used to render Atlas over third-party web pages.

This is important for demonstrating Atlas “inside” an EHR page.

---

## 8. How to onboard quickly

Recommended reading order:

1. `README.md`
2. `docs/project-status.md`
3. `docs/prd.md`
4. `docs/product-roadmap.md`
5. `docs/repository-guide.md`

---

## 9. Contributor advice

When editing this repo:
- do not bypass the PHI boundary
- do not move model calls to the client
- do not allow arbitrary client-provided FHIR writes
- do not weaken confirm-before-write behavior
- keep demo realism separate from production claims

---

## 10. Mental model

Think of the repository as four layers:

1. **Experience layer** — UI and extension
2. **Workflow layer** — drafting, confirmation, audit
3. **Trust layer** — PHI isolation, validation, server control
4. **Strategy layer** — PRD, roadmap, product vision, demo script
