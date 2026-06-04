"use client";

import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function OrderInput({ value, onChange, onSubmit, disabled, loading }: Props) {
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter submits; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !loading) onSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder='e.g. "order a CBC and a chest X-ray, and start metformin 500mg BID"'
        disabled={disabled || loading}
        aria-label="Natural-language order"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {loading ? "Atlas is drafting…" : "Enter to draft · Shift+Enter for a new line"}
        </span>
        <Button size="sm" onClick={onSubmit} disabled={disabled || loading || !value.trim()}>
          Draft orders
        </Button>
      </div>
    </div>
  );
}
