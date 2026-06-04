import { Card } from "@/components/ui/Card";

/**
 * Left pane — the (synthetic) patient chart and live Orders list.
 * Phase 0: placeholder empty state. Wired to live FHIR data in Phase 1 (TASK-014).
 */
export function ChartSummary() {
  return (
    <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="max-w-xs">
        <h2 className="mb-1 text-lg font-semibold text-text">No patient selected</h2>
        <p className="text-sm text-text-muted">
          Select a patient in the Atlas panel to load their chart.
        </p>
      </div>
    </Card>
  );
}
