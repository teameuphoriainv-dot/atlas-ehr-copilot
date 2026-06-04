import { Card } from "@/components/ui/Card";

/**
 * Right pane — the Atlas sidecar that "sits inside" the EHR.
 * Phase 0: placeholder sections. Patient picker, order input, drafts,
 * confirm panel, and audit log are wired in Phases 1–2.
 */
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

export function Sidecar() {
  return (
    <Card className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-primary">Atlas</span>
        <span className="text-xs text-text-muted">EHR Copilot</span>
      </div>

      <Section title="Patient">
        <p className="text-sm text-text-muted">Patient picker — coming in Phase 1.</p>
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
