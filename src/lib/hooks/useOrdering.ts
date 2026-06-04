"use client";

import { useCallback, useState } from "react";
import type { DraftOrder, PatientContext } from "@/lib/types";

export type OrderingStatus =
  | "idle"
  | "drafting"
  | "drafted"
  | "writing"
  | "success"
  | "error";

export function useOrdering(
  patientId: string | null,
  onChartRefresh: (ctx: PatientContext) => void,
) {
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [narration, setNarration] = useState("");
  const [status, setStatus] = useState<OrderingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [writtenCount, setWrittenCount] = useState(0);
  const [auditVersion, setAuditVersion] = useState(0);

  const bumpAudit = () => setAuditVersion((v) => v + 1);

  const submit = useCallback(
    async (override?: string) => {
      if (!patientId) return;
      const requestText = (override ?? text).trim();
      if (!requestText) return;
      setStatus("drafting");
      setError(null);
      setDrafts([]);
      setNarration("");
      setAnswers({});
      try {
        const r = await fetch("/api/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, text: requestText }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Drafting failed");
        setDrafts(Array.isArray(d.drafts) ? d.drafts : []);
        setNarration(d.narration ?? "");
        setStatus("drafted");
        bumpAudit();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Drafting failed");
        setStatus("error");
      }
    },
    [patientId, text],
  );

  // Re-submit the original request augmented with answers to clarifying questions.
  const resolveClarifications = useCallback(() => {
    const additions = drafts
      .map((d, i) =>
        d.needsClarification && answers[i] ? `For ${d.display}: ${answers[i]}` : null,
      )
      .filter(Boolean)
      .join(". ");
    if (!additions) return;
    void submit(`${text}. ${additions}`);
  }, [drafts, answers, text, submit]);

  const confirm = useCallback(async () => {
    if (!patientId) return;
    const confirmable = drafts.filter((d) => !d.needsClarification && d.code);
    if (!confirmable.length) return;
    setStatus("writing");
    setError(null);
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, drafts: confirmable }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Write failed");
      setWrittenCount((d.written ?? []).length);
      if (d.context) onChartRefresh(d.context);
      setStatus("success");
      setDrafts([]);
      setNarration("");
      setText("");
      bumpAudit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Write failed");
      setStatus("error");
      bumpAudit();
    }
  }, [patientId, drafts, onChartRefresh]);

  const reject = useCallback(() => {
    if (patientId) {
      void fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientRef: `Patient/${patientId}`,
          orderSummaries: drafts.map((d) => d.display),
        }),
      }).then(bumpAudit, () => {});
    }
    setDrafts([]);
    setNarration("");
    setStatus("idle");
    setError(null);
    setAnswers({});
  }, [patientId, drafts]);

  const setAnswer = useCallback((index: number, value: string) => {
    setAnswers((a) => ({ ...a, [index]: value }));
  }, []);

  const hasClarifications = drafts.some((d) => d.needsClarification);
  const confirmableCount = drafts.filter((d) => !d.needsClarification && d.code).length;

  return {
    text,
    setText,
    drafts,
    narration,
    status,
    error,
    answers,
    setAnswer,
    writtenCount,
    auditVersion,
    hasClarifications,
    confirmableCount,
    submit,
    confirm,
    reject,
    resolveClarifications,
  };
}
