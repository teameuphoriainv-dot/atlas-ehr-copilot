// Atlas extension background service worker.
// Acts as a fetch proxy to the Atlas API (localhost:3000) so the content script
// avoids page CSP / CORS. The Anthropic key + FHIR access stay in the Atlas server.

const API_BASE = "http://localhost:3000";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.kind === "api") {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}${msg.path}`, {
          method: msg.method || "GET",
          headers: msg.body ? { "Content-Type": "application/json" } : undefined,
          body: msg.body ? JSON.stringify(msg.body) : undefined,
        });
        const data = await res.json().catch(() => null);
        sendResponse({ ok: res.ok, status: res.status, data });
      } catch (e) {
        sendResponse({ ok: false, status: 0, data: { error: String(e) } });
      }
    })();
    return true; // keep the message channel open for the async response
  }
});

// Clicking the toolbar icon toggles the Atlas panel in the active tab.
chrome.action.onClicked.addListener((tab) => {
  if (tab.id != null) chrome.tabs.sendMessage(tab.id, { kind: "toggle" });
});
