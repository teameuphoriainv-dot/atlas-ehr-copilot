"use client";

import { useEffect, useRef, useState } from "react";
import type { CodedItem, PatientContext } from "@/lib/types";

/**
 * A third-party EHR interface skin, rendered from LIVE FHIR data. New items (orders,
 * problems) the agent writes slide in and flash so the change is visible on screen.
 * Generic clinical slate/blue so Atlas (teal) reads as the copilot on top.
 */
interface Props {
  context: PatientContext | null;
}

function ChartCard({
  title,
  items,
  empty,
  newKeys,
}: {
  title: string;
  items: CodedItem[];
  empty: string;
  newKeys?: Set<string>;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white transition-shadow hover:shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="p-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">{empty}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((it, i) => (
              <li
                key={`${it.code}-${i}`}
                className={`flex items-baseline justify-between gap-2 px-1 ${newKeys?.has(it.code) ? "atlas-new" : ""}`}
              >
                <span className="text-sm text-slate-700">{it.display}</span>
                <span className="font-mono text-[11px] text-slate-400">{it.code}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function EhrBackdrop({ context }: Props) {
  const seenOrders = useRef<Set<string> | null>(null);
  const seenProblems = useRef<Set<string> | null>(null);
  const [newOrders, setNewOrders] = useState<Set<string>>(new Set());
  const [newProblems, setNewProblems] = useState<Set<string>>(new Set());

  // Detect items added since the last context (refs read in the effect only).
  useEffect(() => {
    const orderIds = (context?.orders ?? []).map((o) => o.id);
    const problemCodes = (context?.problems ?? []).map((p) => p.code);
    if (seenOrders.current !== null) {
      const fo = new Set(orderIds.filter((id) => !seenOrders.current!.has(id)));
      const fp = new Set(problemCodes.filter((c) => !seenProblems.current!.has(c)));
      if (fo.size) setNewOrders(fo);
      if (fp.size) setNewProblems(fp);
    }
    seenOrders.current = new Set(orderIds);
    seenProblems.current = new Set(problemCodes);
  }, [context]);

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 text-slate-100">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded bg-blue-500 text-xs font-bold">M</span>
          <span className="font-semibold">Meridian Health</span>
          <span className="text-xs text-slate-400">EpicCare · Inpatient</span>
          <span className="ml-1 rounded bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900">
            Demo · synthetic data
          </span>
        </div>
        <nav className="hidden gap-5 text-sm text-slate-300 md:flex">
          {["Chart Review", "Orders", "Notes", "Results", "MAR"].map((t, i) => (
            <span key={t} className={i === 0 ? "text-white" : ""}>{t}</span>
          ))}
        </nav>
        <span className="text-xs text-slate-400">Dr. A. Patel</span>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-300 bg-blue-50 px-4 py-2">
        <div>
          <div className="text-sm font-bold text-slate-800">{context?.displayName ?? "—"}</div>
          <div className="text-xs text-slate-500">
            MRN {context ? `00${context.id}`.slice(-8) : "—"} ·{" "}
            {[context?.sex, context?.ageBand && `${context.ageBand} yrs`].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <div className="hidden gap-6 text-xs text-slate-500 md:flex">
          <span><span className="font-semibold text-slate-700">{context?.problems.length ?? 0}</span> problems</span>
          <span><span className="font-semibold text-slate-700">{context?.medications.length ?? 0}</span> meds</span>
          <span><span className="font-semibold text-rose-600">{context?.allergies.length ?? 0}</span> allergies</span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-auto p-4 lg:grid-cols-3">
        <ChartCard title="Problem List" items={context?.problems ?? []} empty="No active problems" newKeys={newProblems} />
        <ChartCard title="Medications" items={context?.medications ?? []} empty="No active medications" />
        <ChartCard title="Allergies" items={context?.allergies ?? []} empty="NKDA" />

        <div className="lg:col-span-3">
          <div className="rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vitals
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-3 sm:grid-cols-4 lg:grid-cols-8">
              {(context?.vitals ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No vitals recorded</p>
              ) : (
                context!.vitals.map((v, i) => (
                  <div key={`${v.label}-${i}`} className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">{v.label}</span>
                    <span className="text-sm font-semibold text-slate-700">{v.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Orders
            </div>
            <div className="p-3">
              {!context || context.orders.length === 0 ? (
                <p className="text-sm text-slate-400">No active orders</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {context.orders.map((o) => (
                    <li
                      key={o.id}
                      className={`flex items-center justify-between gap-2 px-1 ${newOrders.has(o.id) ? "atlas-new" : ""}`}
                    >
                      <span className="text-sm text-slate-700">{o.display}</span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                        {o.resourceType.replace("Request", "")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
