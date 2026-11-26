# StepRecover — controlled browser recovery demo

**wHACKiest 2026 · Team X · Track 2 — Beyond the Browser**

Sapthagiri NPS University · Team ID `7b99f093`

StepRecover explores a simple promise: detect a supported obstacle, explain it, ask before acting, and verify what the page accepted. This repository contains a local Chrome Manifest V3 prototype for one deliberately keyboard-inaccessible workshop date picker.

> This is a controlled competition prototype, not a general accessibility auditor or production extension. All form data is synthetic and the form is never submitted.

## Implemented

- Local workshop registration page with name, email, session date, and live validation feedback.
- Deliberately click-only date choices, documented in the page itself as a training defect.
- React and TypeScript Chrome side panel with deterministic checks for the visible, labelled local picker, valid date options, and keyboard-focus behavior.
- Date options and labels are read from the current page DOM; the extension has no hard-coded workshop dates.
- Keyboard-accessible date choice controls and an approval dialog showing the action, target, and captured value. Cancel and Escape leave the page unchanged.
- The approval is bound to the inspected tab, window, URL, picker fingerprint, and chosen date. The extension rechecks those signals immediately before its single allowlisted click and refuses stale approvals.
- Outcome states: **Accepted**, **Not confirmed**, and **Unsupported**. Accepted requires the exact observed field value, accepted validation state, and expected live status text. The panel reports those observed values and confirms the form was not submitted.
- Limited Chrome access: `activeTab`, `scripting`, `sidePanel`, and only `http://localhost:4173/*` host access. It does not inspect other tabs.
- Unit tests for obstacle classification and verification semantics.

## Architecture

```text
DETECT → UNDERSTAND → RECOVER → VERIFY
  active-tab    explain +       approval-     page-observed
  local scan    accessible date  gated click   value + status
```

The extension inspects only the active `http://localhost:4173` tab after the side panel is opened. It takes the available dates from the visible local form, then offers a keyboard-accessible choice and requires explicit approval. Before acting, it checks that the same tab, page, picker, and approved date are still present. It uses the page's own visible date option click handler, then waits briefly for and checks both the date field and a specific live validation signal. No LLM, backend, database, or form submission is used.

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
2. Open StepRecover from the extension toolbar and choose **Inspect this page**. The panel reads the visible dates and checks the supported picker pattern.
3. Use Tab and arrow keys to choose a date with the panel's native radio controls.
4. Select **Review recovery**. Check the proposed action, target field, and captured date. The dialog initially focuses **Cancel**.
5. Choose **Cancel** or press Escape to confirm the page stays unchanged and the panel reports cancellation. Reopen the review to continue.
6. Approve the recovery. If the active tab, page, picker, or date list changed since inspection, the extension stops without clicking and asks you to inspect again.
7. The extension activates the matching visible option, waits up to 1.4 seconds, and checks the field value, validation state, and `Session date selected.` status. The panel shows the observed evidence. Nothing submits the form.
8. Choose **Inspect again** or use **Reset demo** on the page to start over.

## Current limitations

- Supports only the included local workshop form and one known date-picker pattern.
- The date choices are a deliberately broken demo component, not a third-party calendar integration.
- Detection uses DOM signals and is not a complete assistive-technology audit.
- The side panel accepts no other page origin and provides no general repair suggestions.
- The unclear-validation-error scenario, broader site support, persistent storage, AI, and submission are not implemented.
- Manual testing was performed on the local page in the in-app browser; the unpacked extension still needs a Chrome-profile install and full detection, approval, cancellation, recovery, and outcome walkthrough. Automated checks do not replace testing with screen readers or browser accessibility tools.

## Status

- **Prototype implementation:** source, local demo, and unpacked extension build are present.
- **Automated checks:** `npm run build` and `npm test` (3 tests) pass.
- **Local page walkthrough:** the page rendered, date selection updated the field and status, Enter did not submit or navigate, and Reset cleared the fields and returned focus to the name field.
- **Manual Chrome extension walkthrough:** not yet completed. Extension installation and the detection, approval, recovery, cancellation, and outcome-reporting flow remain unverified until the unpacked extension is loaded in Chrome.
- **Team:** Team X, Track 2 — Beyond the Browser.
