# StepRecover — controlled browser recovery demo

**wHACKiest 2026 · Team X · Track 2 — Beyond the Browser**

Sapthagiri NPS University · Team ID `7b99f093`

StepRecover explores a simple promise: detect a supported obstacle, explain it, ask before acting, and verify what the page accepted. This repository contains a local Chrome Manifest V3 prototype for one deliberately keyboard-inaccessible workshop date picker.

> This is a controlled competition prototype, not a general accessibility auditor or production extension. All form data is synthetic and the form is never submitted.

## Implemented

- Local workshop registration page with name, email, session date, and live validation feedback.
- Deliberately click-only date choices, documented in the page itself as a training defect.
- React and TypeScript Chrome side panel with deterministic page-signal checks.
- Accessible date selection with native radio controls and keyboard focus.
- Approval dialog showing action, target, and selected value; Cancel does not mutate the form.
- One allowlisted recovery action: activate a matching visible date option on the controlled page.
- Outcome states: **Accepted**, **Failed**, and **Unsupported**. Accepted requires the visible field value and the form's explicit validation status to match.
- Limited Chrome access: `activeTab`, `scripting`, `sidePanel`, and only `http://localhost:4173/*` host access. It does not inspect other tabs.
- Unit tests for obstacle classification and verification semantics.

## Architecture

```text
DETECT → UNDERSTAND → RECOVER → VERIFY
  active-tab    explain +       approval-     page-observed
  local scan    accessible date  gated click   value + status
```

The extension scans only the active tab after it is opened and only the controlled demo origin. It uses the page's own visible date option click handler, then checks both the date field and a specific live validation signal. No LLM, backend, database, or form submission is used.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- Google Chrome 116+

## Run the local demonstration

```powershell
npm install
npm run build
npm test
npm run demo
```

Open [http://localhost:4173](http://localhost:4173). The page uses the visible mouse-only choices to demonstrate the obstacle. Leave the page open for the extension walkthrough.

## Load the unpacked Chrome extension

In Chrome, open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose the repository's `dist/extension` directory.

Pin or open **StepRecover — Controlled Demo** from the Chrome toolbar while the local demo is active. The toolbar action opens the side panel for the active tab.

## Demonstrate the recovery

1. Keep the local registration page at `http://localhost:4173` active. Its three session choices are mouse-clickable but intentionally absent from keyboard focus order.
2. Open StepRecover from the extension toolbar and choose **Inspect this page**. The panel identifies only the supported date-picker pattern.
3. Use Tab and arrow keys to choose a session with the panel's native radio controls.
4. Select **Review recovery**. Check the proposed action, target field, and date.
5. Choose **Cancel** to confirm the page stays unchanged, or reopen the review and approve.
6. The extension activates the matching visible option and checks the field value plus `Session date selected.` status.
7. The panel reports Accepted only when both signals match. Nothing submits the form.

## Current limitations

- Supports only the included local workshop form and one known date-picker pattern.
- The date choices are a deliberately broken demo component, not a third-party calendar integration.
- Detection uses DOM signals and is not a complete assistive-technology audit.
- The side panel accepts no other page origin and provides no general repair suggestions.
- The unclear-validation-error scenario, broader site support, persistent storage, AI, and submission are not implemented.
- Browser extension installation and manual Chrome walkthrough must be performed in a local Chrome profile. Automated checks do not replace testing with screen readers or browser accessibility tools.

## Status

- **Prototype implementation:** source, local demo, and unpacked extension build are present.
- **Automated checks:** `npm run build` and `npm test` (2 tests) pass.
- **Manual Chrome extension walkthrough:** pending; automated checks do not establish that the extension was installed or exercised in Chrome.
- **Team:** Team X, Track 2 — Beyond the Browser.
