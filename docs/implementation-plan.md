# Implementation Plan — Atlas

This document translates the existing strategy and roadmap into practical next steps after the current MVP.

---

## Planning principle

Do not dilute the wedge.

Atlas wins by being:
- fast to understand
- safe to trust
- narrow enough to work reliably

The planning goal is to strengthen those traits before expanding feature scope.

---

## Phase A — Documentation + demo hardening

### Goals
- make the repo easy to understand in minutes
- reduce demo ambiguity
- improve resilience under presentation conditions

### Deliverables
- stronger README
- repo guide
- project status doc
- implementation plan doc
- explicit real-vs-mock language across docs
- architecture and safety diagrams

### Success criteria
- a new contributor can explain the system after 10 minutes
- a judge can understand what is real vs mocked without asking
- a reviewer can identify the trust boundary quickly

---

## Phase B — Reliability and validation hardening

### Goals
- make the MVP more reproducible
- reduce demo risk
- improve confidence in draft correctness

### Deliverables
- expanded draft validation coverage
- measured draft latency and write latency baselines
- failure-mode inventory
- stronger regression tests around vocabulary and write safety
- improved error reporting and recovery notes

### Success criteria
- repeated demo runs have stable outcomes
- known failures are documented with recovery steps
- order drafting reliability is measurable, not anecdotal

---

## Phase C — Pilot-readiness planning

### Goals
- define the gap between hackathon MVP and real pilot
- avoid vague “we’ll productionize later” thinking

### Workstreams

#### Auth and launch
- real SMART-on-FHIR launch plan
- token handling model
- patient context launch assumptions

#### Audit and persistence
- durable audit store
- event retention model
- reviewability of clinician actions

#### Infrastructure
- environment separation
- secure secret management
- deployment topology
- monitoring and incident visibility

#### Safety and governance
- change review for prompts and vocabulary
- validation governance for clinical mappings
- clinician review loop

### Success criteria
- there is a concrete pilot architecture proposal
- production gaps are documented with owners and sequence

---

## Phase D — Product expansion only after hardening

### Candidate expansions
- additional order vocabulary
- stronger allergy/interaction checks
- alternate confirm granularity
- second “copilot action” beyond orders

### Guardrails
Do not expand if it weakens:
- trust
- speed
- clarity
- reliability of the magic moment

---

## Recommended sequencing

1. docs + repo clarity
2. demo hardening + test coverage
3. pilot architecture definition
4. production control plane planning
5. feature expansion

---

## Decision filter for future work

Before adding any feature, ask:

1. Does it strengthen the core magic moment?
2. Does it preserve confirm-before-write?
3. Does it preserve PHI isolation?
4. Does it increase reliability more than complexity?
5. Is it more valuable than making the current loop more trustworthy?

If the answer is mostly no, do not build it yet.
