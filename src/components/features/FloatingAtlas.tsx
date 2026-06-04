"use client";

import { useState } from "react";
import { GripVertical, Minus, Plus, Stethoscope } from "lucide-react";
import { PatientPicker } from "./PatientPicker";
import { OrderPanel } from "./OrderPanel";
import { useDrag } from "@/lib/hooks/useDrag";
import type { PatientContext, PatientListItem } from "@/lib/types";

interface Props {
  patients: PatientListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  patientName: string;
  onChartRefresh: (ctx: PatientContext) => void;
}

/** The Atlas copilot as a draggable, minimizable window floating over the EHR. */
export function FloatingAtlas({
  patients,
  selectedId,
  onSelect,
  patientName,
  onChartRefresh,
}: Props) {
  const { pos, dragging, onPointerDown } = useDrag({ x: 0, y: 0 });
  const [minimized, setMinimized] = useState(false);

  // Default to the right side until the user drags it.
  const style: React.CSSProperties =
    pos.x === 0 && pos.y === 0
      ? { right: 24, top: 88 }
      : { left: pos.x, top: pos.y };

  return (
    <div
      className="fixed z-50 w-[380px] max-w-[92vw] overflow-hidden rounded-xl border border-primary/20 bg-surface shadow-lg"
      style={style}
    >
      {/* Title bar — drag handle */}
      <div
        onPointerDown={onPointerDown}
        className={`flex items-center justify-between bg-primary px-3 py-2 text-white select-none ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 opacity-60" aria-hidden />
          <Stethoscope className="h-4 w-4" aria-hidden />
          <span className="font-semibold">Atlas</span>
          <span className="text-xs text-white/60">EHR Copilot</span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized((m) => !m)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={minimized ? "Expand Atlas" : "Minimize Atlas"}
          className="rounded p-1 hover:bg-white/15"
        >
          {minimized ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
        </button>
      </div>

      {!minimized && (
        <div className="flex max-h-[78vh] flex-col gap-4 overflow-auto p-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Patient
            </h3>
            <PatientPicker patients={patients} selectedId={selectedId} onSelect={onSelect} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Order
            </h3>
            <OrderPanel
              patientId={selectedId}
              patientName={patientName}
              onChartRefresh={onChartRefresh}
            />
          </div>
        </div>
      )}
    </div>
  );
}
