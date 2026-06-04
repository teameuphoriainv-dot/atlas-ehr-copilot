"use client";

import { Card } from "@/components/ui/Card";
import { PatientPicker } from "./PatientPicker";
import type { PatientListItem } from "@/lib/types";

interface Props {
  patients: PatientListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * The Atlas sidecar that "sits inside" the EHR.
 * Phase 1: live patient picker. Order input, draft/confirm, and audit arrive in Phase 2.
 */
export function Sidecar({ patients, selectedId, onSelect }: Props) {
  return (
    <Card className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-primary">Atlas</span>
        <span className="text-xs text-text-muted">EHR Copilot</span>
      </div>

      <Section title="Patient">
        <PatientPicker patients={patients} selectedId={selectedId} onSelect={onSelect} />
      </Section>

      <Section title="Order">
        <p className="text-sm text-text-muted">
          Natural-language order input — coming in Phase 2.
        </p>
      </Section>

      <Section title="Activity">
        <p className="text-sm text-text-muted">Audit log — coming in Phase 2.</p>
      </Section>
    </Card>
  );
}
