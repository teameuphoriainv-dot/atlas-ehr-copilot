# Atlas — Chrome Extension (EHR overlay)

A draggable Atlas copilot panel that injects **on top of any web page** — including a real
EHR (Epic sandbox, OpenEMR, etc.). It calls the Atlas backend (which holds the Anthropic key
and does all FHIR reads/writes), so orders Atlas places are real FHIR writes.

## How it works
```
content.js (overlay UI on the EHR page)
   └─ chrome.runtime.sendMessage ─▶ background.js (fetch proxy)
                                        └─ http://localhost:3000/api/*  (Atlas server: Claude + FHIR)
```
The background worker proxies API calls so there are no page-CSP/CORS problems, and no secrets
ever touch the page.

## Load it (developer mode)
1. Start the Atlas server: `npm run dev` (from the repo root) — must be on `http://localhost:3000`.
2. Open `chrome://extensions`, toggle **Developer mode** (top right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Open any EHR page (or any web page). A teal **"A"** button appears bottom-right — click it to open Atlas. Or click the Atlas toolbar icon to toggle.

## Use it
- Pick a patient, type an order (e.g. *"order a CBC and start metformin 500mg BID"*), click **Draft orders**.
- Review the coded drafts → **Confirm** → orders are written to the FHIR server.
- Drag the panel by its title bar; minimize with **–**, close with **×**.

## Notes
- Points at `http://localhost:3000` by default (see `API_BASE` in `background.js` and
  `host_permissions` in `manifest.json`). Change both to target a deployed Atlas server.
- To overlay a specific EHR only, narrow `content_scripts.matches` in `manifest.json`.
- This is the only way to render a draggable Atlas panel on a third-party EHR's *actual*
  page — a normal web app can't draw over another origin's DOM.
