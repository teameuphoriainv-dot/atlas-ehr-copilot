import Link from "next/link";
import { ChartSummary } from "@/components/features/ChartSummary";
import { Sidecar } from "@/components/features/Sidecar";

/**
 * The EHR workspace — a two-pane "inside the EHR" demo shell.
 * Left: patient chart. Right: the Atlas sidecar (fixed-width panel; full-width sheet below md).
 */
export default function WorkspacePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">Atlas</span>
          <span className="text-sm text-text-muted">EHR Workspace (demo)</span>
        </div>
        <Link href="/login" className="text-sm text-text-muted hover:text-primary">
          Demo login
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 p-4 md:flex-row">
        <section className="flex-1">
          <ChartSummary />
        </section>
        <aside className="w-full md:w-[400px] md:shrink-0">
          <Sidecar />
        </aside>
      </main>
    </div>
  );
}
