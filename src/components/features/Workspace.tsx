"use client";

import Link from "next/link";
import { usePatientData } from "@/lib/hooks/usePatientData";
import { ChartSummary } from "./ChartSummary";
import { Sidecar } from "./Sidecar";

/** The EHR workspace — holds patient selection state and wires the two panes together. */
export function Workspace() {
  const { patients, selectedId, context, loading, error, select, refresh, setContext } =
    usePatientData();

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
          <ChartSummary
            context={context}
            loading={loading}
            error={error}
            onRetry={refresh}
          />
        </section>
        <aside className="w-full md:w-[400px] md:shrink-0">
          <Sidecar
            patients={patients}
            selectedId={selectedId}
            onSelect={select}
            patientName={context?.displayName ?? "this patient"}
            onChartRefresh={setContext}
          />
        </aside>
      </main>
    </div>
  );
}
