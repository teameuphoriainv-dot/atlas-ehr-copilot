// Atlas EHR Copilot — content script. Injects a draggable copilot panel over any page
// (your EHR). Talks to the Atlas API via the background service worker. Style-isolated
// in a shadow root so the host page's CSS can't interfere.

(function () {
  if (window.__atlasInjected) return;
  window.__atlasInjected = true;

  const api = (method, path, body) =>
    new Promise((resolve) => {
      chrome.runtime.sendMessage({ kind: "api", method, path, body }, (resp) =>
        resolve(resp || { ok: false, data: { error: "No response from Atlas background" } }),
      );
    });

  const state = {
    open: false,
    minimized: false,
    patients: [],
    patientId: null,
    patientName: "this patient",
    text: "",
    drafts: [],
    answers: {},
    status: "idle", // idle | drafting | drafted | writing | success | error
    error: null,
    narration: "",
    writtenCount: 0,
    pos: null, // {x,y}
  };

  // ---- Shadow host ----
  const host = document.createElement("div");
  host.id = "atlas-ext-host";
  host.style.cssText = "all: initial; position: fixed; z-index: 2147483647;";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  const TEAL = "#2a474e";
  root.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif; }
      .fab {
        position: fixed; right: 24px; bottom: 24px; width: 52px; height: 52px;
        border-radius: 999px; background: ${TEAL}; color: #fff; border: none; cursor: pointer;
        font-weight: 700; font-size: 18px; box-shadow: 0 8px 24px rgba(42,71,78,.28);
      }
      .panel {
        position: fixed; width: 360px; max-width: 92vw; background: #fff; color: #1a2023;
        border: 1px solid rgba(74,85,87,.2); border-radius: 12px; overflow: hidden;
        box-shadow: 0 16px 48px rgba(42,71,78,.18);
      }
      .bar {
        display: flex; align-items: center; justify-content: space-between;
        background: ${TEAL}; color: #fff; padding: 8px 12px; cursor: grab; user-select: none;
      }
      .bar.drag { cursor: grabbing; }
      .bar .t { font-weight: 600; font-size: 14px; }
      .bar .sub { font-size: 11px; color: rgba(255,255,255,.6); margin-left: 6px; }
      .bar button { background: transparent; border: none; color: #fff; cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 6px; }
      .bar button:hover { background: rgba(255,255,255,.15); }
      .body { padding: 14px; display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow: auto; }
      .lbl { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #4a5557; margin-bottom: 6px; }
      select, textarea {
        width: 100%; border: 1px solid rgba(74,85,87,.25); border-radius: 6px; padding: 8px;
        font-size: 14px; color: #1a2023; background: #fff;
      }
      textarea { min-height: 72px; resize: vertical; }
      select:focus, textarea:focus { outline: 2px solid ${TEAL}; outline-offset: 1px; border-color: ${TEAL}; }
      .row { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
      .btn { background: ${TEAL}; color: #fff; border: none; border-radius: 6px; padding: 8px 14px; font-weight: 600; font-size: 13px; cursor: pointer; }
      .btn:disabled { opacity: .5; cursor: not-allowed; }
      .btn.ghost { background: #fff; color: #ba1a1a; border: 1px solid rgba(186,26,26,.5); }
      .btn.sm { padding: 6px 10px; font-size: 12px; }
      .hint { font-size: 11px; color: #4a5557; }
      .draft { border: 1px solid rgba(74,85,87,.2); border-radius: 6px; padding: 8px; }
      .draft .d { font-size: 13px; font-weight: 500; }
      .draft .meta { font-size: 11px; color: #4a5557; margin-top: 2px; }
      .code { display: inline-block; background: #cbe3e9; color: ${TEAL}; font-family: "JetBrains Mono", monospace; font-size: 11px; padding: 1px 6px; border-radius: 4px; margin-top: 4px; }
      .clar { border: 1px solid rgba(176,84,54,.4); background: rgba(176,84,54,.06); border-radius: 6px; padding: 8px; }
      .clar .q { font-size: 12px; color: #b05436; margin: 2px 0 6px; }
      .confirm { border: 1px solid rgba(74,85,87,.2); border-radius: 8px; padding: 10px; box-shadow: 0 8px 24px rgba(42,71,78,.06); }
      .confirm .sum { font-size: 13px; margin-bottom: 8px; }
      .ok { color: #557d6e; font-weight: 600; }
      .err { color: #ba1a1a; }
      .hidden { display: none !important; }
    </style>
    <button class="fab" id="fab" title="Open Atlas">A</button>
    <div class="panel hidden" id="panel">
      <div class="bar" id="bar">
        <div><span class="t">Atlas</span><span class="sub">EHR Copilot</span></div>
        <div>
          <button id="min" title="Minimize">–</button>
          <button id="close" title="Close">×</button>
        </div>
      </div>
      <div class="body" id="body"></div>
    </div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const panel = $("#panel");
  const fab = $("#fab");
  const bar = $("#bar");
  const body = $("#body");

  // ---- API flows ----
  async function loadPatients() {
    const r = await api("GET", "/api/patients");
    if (r.ok && r.data && Array.isArray(r.data.patients)) {
      state.patients = r.data.patients;
      if (state.patients[0]) await selectPatient(state.patients[0].id);
    } else {
      state.error = "Couldn't reach Atlas API (is npm run dev running?)";
    }
    render();
  }

  async function selectPatient(id) {
    state.patientId = id;
    const r = await api("GET", `/api/patient?id=${encodeURIComponent(id)}`);
    if (r.ok && r.data && r.data.context) state.patientName = r.data.context.displayName;
    render();
  }

  async function draft() {
    if (!state.patientId || !state.text.trim()) return;
    state.status = "drafting";
    state.drafts = [];
    state.narration = "";
    state.error = null;
    state.answers = {};
    render();
    const r = await api("POST", "/api/draft?stream=0", {
      patientId: state.patientId,
      text: state.text,
    });
    if (!r.ok) {
      state.status = "error";
      state.error = (r.data && r.data.error) || "Drafting failed";
    } else {
      state.drafts = (r.data && r.data.drafts) || [];
      state.narration = (r.data && r.data.narration) || "";
      state.status = "drafted";
    }
    render();
  }

  function resolveClarifications() {
    const additions = state.drafts
      .map((d, i) => (d.needsClarification && state.answers[i] ? `For ${d.display}: ${state.answers[i]}` : null))
      .filter(Boolean)
      .join(". ");
    if (!additions) return;
    state.text = `${state.text}. ${additions}`;
    draft();
  }

  async function confirm() {
    const confirmable = state.drafts.filter((d) => !d.needsClarification && d.code);
    if (!confirmable.length || !state.patientId) return;
    state.status = "writing";
    render();
    const r = await api("POST", "/api/orders", { patientId: state.patientId, drafts: confirmable });
    if (!r.ok) {
      state.status = "error";
      state.error = (r.data && r.data.error) || "Write failed";
    } else {
      state.writtenCount = ((r.data && r.data.written) || []).length;
      state.status = "success";
      state.drafts = [];
      state.text = "";
    }
    render();
  }

  function reject() {
    state.drafts = [];
    state.narration = "";
    state.status = "idle";
    state.error = null;
    state.answers = {};
    render();
  }

  // ---- Render ----
  function render() {
    fab.classList.toggle("hidden", state.open);
    panel.classList.toggle("hidden", !state.open);
    if (!state.open) return;

    if (state.pos) {
      panel.style.left = state.pos.x + "px";
      panel.style.top = state.pos.y + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    } else {
      panel.style.right = "24px";
      panel.style.bottom = "24px";
      panel.style.left = "auto";
      panel.style.top = "auto";
    }

    if (state.minimized) {
      body.classList.add("hidden");
      return;
    }
    body.classList.remove("hidden");

    const opts = state.patients
      .map((p) => `<option value="${p.id}" ${p.id === state.patientId ? "selected" : ""}>${escapeHtml(p.displayName)}</option>`)
      .join("");

    const draftsHtml = state.drafts
      .map((d, i) => {
        if (d.needsClarification) {
          return `<div class="clar"><div class="d">${escapeHtml(d.display)}</div><div class="q">${escapeHtml(d.needsClarification)}</div>
            <input data-ans="${i}" placeholder="Answer…" value="${escapeHtml(state.answers[i] || "")}" style="width:100%;border:1px solid rgba(74,85,87,.25);border-radius:6px;padding:6px;font-size:13px;"/></div>`;
        }
        const meta = [d.dose, d.route, d.frequency].filter(Boolean).join(" · ");
        const code = d.code ? `<span class="code">${escapeHtml(d.code.code)}</span>` : "";
        return `<div class="draft"><div class="d">${escapeHtml(d.display)}</div>${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ""}${code}</div>`;
      })
      .join("");

    const hasClar = state.drafts.some((d) => d.needsClarification);
    const confirmable = state.drafts.filter((d) => !d.needsClarification && d.code).length;

    let actionHtml = "";
    if (state.status === "success") {
      actionHtml = `<div class="confirm"><span class="ok">✓ ${state.writtenCount} order(s) placed</span><div class="hint">They now appear in the chart.</div></div>`;
    } else if (state.status === "error") {
      actionHtml = `<div class="confirm"><span class="err">Something went wrong</span><div class="hint">${escapeHtml(state.error || "")}</div></div>`;
    } else if (state.drafts.length) {
      actionHtml = `
        ${hasClar ? `<button class="btn sm" id="resolve">Update with answers</button>` : ""}
        <div class="confirm">
          <div class="sum">${escapeHtml(state.narration || `Ready to place ${confirmable} order(s) for ${state.patientName}.`)}</div>
          <div class="row" style="justify-content:flex-start;gap:8px;">
            <button class="btn" id="confirm" ${hasClar || !confirmable ? "disabled" : ""}>${state.status === "writing" ? "Placing…" : `Confirm ${confirmable} order(s)`}</button>
            <button class="btn ghost" id="reject">Reject</button>
          </div>
        </div>`;
    } else if (state.status === "drafted") {
      actionHtml = `<div class="hint">Atlas couldn't map that to a known order. Try rephrasing.</div>`;
    } else if (state.status === "drafting") {
      actionHtml = `<div class="hint">Atlas is drafting…</div>`;
    }

    body.innerHTML = `
      ${state.error && !state.patients.length ? `<div class="err" style="font-size:13px;">${escapeHtml(state.error)}</div>` : ""}
      <div>
        <div class="lbl">Patient</div>
        <select id="patient">${opts || `<option>Loading…</option>`}</select>
      </div>
      <div>
        <div class="lbl">Order</div>
        <textarea id="text" placeholder='e.g. "order a CBC and start metformin 500mg BID"'>${escapeHtml(state.text)}</textarea>
        <div class="row" style="margin-top:6px;">
          <span class="hint">Enter to draft</span>
          <button class="btn sm" id="draftbtn" ${state.status === "drafting" ? "disabled" : ""}>Draft orders</button>
        </div>
      </div>
      ${draftsHtml ? `<div style="display:flex;flex-direction:column;gap:8px;">${draftsHtml}</div>` : ""}
      ${actionHtml}
    `;

    // wire body controls
    const sel = $("#patient");
    if (sel) sel.onchange = (e) => selectPatient(e.target.value);
    const ta = $("#text");
    if (ta) {
      ta.oninput = (e) => { state.text = e.target.value; };
      ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); draft(); } };
    }
    const db = $("#draftbtn");
    if (db) db.onclick = draft;
    const cf = $("#confirm");
    if (cf) cf.onclick = confirm;
    const rj = $("#reject");
    if (rj) rj.onclick = reject;
    const rs = $("#resolve");
    if (rs) rs.onclick = resolveClarifications;
    root.querySelectorAll("[data-ans]").forEach((inp) => {
      inp.oninput = (e) => { state.answers[Number(e.target.getAttribute("data-ans"))] = e.target.value; };
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---- Open/close/minimize ----
  fab.onclick = () => { state.open = true; state.minimized = false; render(); if (!state.patients.length) loadPatients(); };
  $("#close").onclick = () => { state.open = false; render(); };
  $("#min").onclick = () => { state.minimized = !state.minimized; render(); };

  // ---- Drag ----
  let dragging = false, off = { x: 0, y: 0 };
  bar.addEventListener("pointerdown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    dragging = true; bar.classList.add("drag");
    const rect = panel.getBoundingClientRect();
    off = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.preventDefault();
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    state.pos = {
      x: Math.min(Math.max(0, e.clientX - off.x), window.innerWidth - 120),
      y: Math.min(Math.max(0, e.clientY - off.y), window.innerHeight - 50),
    };
    panel.style.left = state.pos.x + "px"; panel.style.top = state.pos.y + "px";
    panel.style.right = "auto"; panel.style.bottom = "auto";
  });
  window.addEventListener("pointerup", () => { dragging = false; bar.classList.remove("drag"); });

  // ---- Toolbar toggle ----
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.kind === "toggle") {
      state.open = !state.open;
      if (state.open && !state.patients.length) loadPatients();
      render();
    }
  });

  render();
})();
