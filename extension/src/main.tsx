import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { classifyInspection, isApprovalCurrent, verifyOutcome } from "../../src/core.mjs";
import "./panel.css";

type Phase = "idle" | "inspecting" | "unsupported" | "ready" | "recovering" | "verifying" | "result" | "cancelled";
type Outcome = "accepted" | "failed" | "unsupported";
type PageSnapshot = {
  supported?: boolean; accepted?: boolean;
  controlledDemo?: boolean; pickerVisible?: boolean; evidenceAvailable?: boolean;
  keyboardFocusableOptions?: number; dateFieldLabel?: string; availableDates?: string[];
  dateOptions?: { date: string; title: string }[]; fieldValue?: string; statusText?: string;
  validationState?: string; fingerprint?: string; url?: string; pageTitle?: string;
  attempted?: boolean; reason?: string;
};
type Inspection = { tabId: number; windowId: number; url: string; fingerprint: string; availableDates: string[]; dateOptions: { date: string; title: string }[] };
type ApprovedAction = Inspection & { date: string; title: string };

async function activeDemoTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined || tab.windowId === undefined || !tab.url) throw new Error("No active browser tab is available.");
  const url = new URL(tab.url);
  if (url.origin !== "http://localhost:4173") throw new Error("Open the local StepRecover demo at http://localhost:4173 first.");
  return tab;
}

function inspectOrRecoverPage(mode: "inspect" | "recover", expectedFingerprint?: string, selectedDate?: string): PageSnapshot {
  const origin = "http://localhost:4173";
  const form = document.querySelector<HTMLFormElement>('form[data-steprecover-demo="true"]');
  const picker = form?.querySelector<HTMLElement>("[data-steprecover-picker]");
  const field = form?.querySelector<HTMLInputElement>("#session-date");
  const status = form?.querySelector<HTMLElement>("[data-steprecover-status]");
  const label = form?.querySelector<HTMLLabelElement>('label[for="session-date"]');
  const isVisible = (element: Element | null | undefined) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
  };
  const options = form ? [...form.querySelectorAll<HTMLElement>('[data-steprecover-date][role="option"]')] : [];
  const dates = options.map((option) => option.dataset.steprecoverDate ?? "");
  const uniqueValidDates = dates.length > 0 && new Set(dates).size === dates.length && dates.every((date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const parsed = new Date(`${date}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
  });
  const dateOptions = options.map((option, index) => ({
    date: dates[index],
    title: option.querySelector<HTMLElement>(".session-copy b")?.textContent?.trim() || option.textContent?.trim() || dates[index],
  }));
  const disabled = options.some((option) => option.getAttribute("aria-disabled") === "true" || option.hasAttribute("disabled"));
  const visible = location.origin === origin && isVisible(form) && isVisible(picker) && isVisible(field) && isVisible(status) && isVisible(label) && options.every(isVisible);
  const keyboardFocusableOptions = options.filter((option) => option.tabIndex >= 0 || option.isContentEditable
    || Boolean(option.querySelector('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]'))).length;
  const statusText = status?.textContent?.trim() ?? "";
  const validationState = status?.getAttribute("data-validation-state") ?? "";
  const fingerprint = JSON.stringify({
    url: location.href,
    started: performance.timeOrigin,
    title: document.title,
    label: label?.textContent?.trim() ?? "",
    pickerLabel: picker?.getAttribute("aria-label") ?? "",
    dates,
    optionLabels: dateOptions.map((option) => option.title),
    visible,
    keyboardFocusableOptions,
    disabled,
    fieldValue: field?.value ?? "",
    statusText,
    validationState,
  });
  const base: PageSnapshot = {
    controlledDemo: location.origin === origin && Boolean(form), pickerVisible: visible,
    evidenceAvailable: visible && Boolean(field && status && label) && uniqueValidDates && !disabled,
    keyboardFocusableOptions, dateFieldLabel: label?.textContent?.replace(/required/i, "").trim() ?? "",
    availableDates: uniqueValidDates ? dates : [], dateOptions, fieldValue: field?.value ?? "",
    statusText, validationState, fingerprint, url: location.href, pageTitle: document.title,
  };
  if (mode === "inspect") return base;
  if (!base.evidenceAvailable || keyboardFocusableOptions !== 0 || !expectedFingerprint || fingerprint !== expectedFingerprint || !selectedDate || !dates.includes(selectedDate)) {
    return { ...base, attempted: false, reason: "The inspected page or date list changed after approval was requested." };
  }
  const target = options[dates.indexOf(selectedDate)];
  if (!target || target.getAttribute("aria-disabled") === "true" || target.hasAttribute("disabled")) {
    return { ...base, attempted: false, reason: "The approved date is no longer available." };
  }
  target.click();
  return { ...base, attempted: true };
}

async function readPageOutcome(selectedDate: string): Promise<PageSnapshot> {
  const deadline = Date.now() + 1400;
  let snapshot: PageSnapshot = { controlledDemo: false };
  do {
    const form = document.querySelector<HTMLFormElement>('form[data-steprecover-demo="true"]');
    const field = form?.querySelector<HTMLInputElement>("#session-date");
    const status = form?.querySelector<HTMLElement>("[data-steprecover-status]");
    const label = form?.querySelector<HTMLLabelElement>('label[for="session-date"]');
    const picker = form?.querySelector<HTMLElement>("[data-steprecover-picker]");
    const rect = (element: Element | null) => element?.getBoundingClientRect();
    const visible = (element: Element | null | undefined) => {
      if (!element) return false;
      const style = getComputedStyle(element); const box = rect(element);
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && Boolean(box && box.width > 0 && box.height > 0);
    };
    const fieldValue = field?.value ?? "";
    const validationState = status?.getAttribute("data-validation-state") ?? "";
    const statusText = status?.textContent?.trim() ?? "";
    const evidenceAvailable = location.origin === "http://localhost:4173" && Boolean(form && visible(form) && visible(field) && visible(status) && visible(label) && visible(picker));
    snapshot = {
      supported: evidenceAvailable,
      evidenceAvailable,
      accepted: fieldValue === selectedDate && validationState === "accepted" && statusText === "Session date selected.",
      fieldValue, validationState, statusText,
    };
    if (snapshot.accepted) return snapshot;
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  return snapshot;
}

function Panel() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [dateOptions, setDateOptions] = useState<{ date: string; title: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvedAction, setApprovedAction] = useState<ApprovedAction | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [observed, setObserved] = useState<PageSnapshot | null>(null);
  const busyRef = useRef(false);
  const inspectionRef = useRef<Inspection | null>(null);
  const reviewButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (approvalOpen) cancelButtonRef.current?.focus();
    if (phase === "result" || phase === "cancelled" || phase === "unsupported") resultHeadingRef.current?.focus();
  }, [approvalOpen, phase]);

  useEffect(() => {
    const invalidate = (reason: string) => {
      if (!inspectionRef.current || busyRef.current) return;
      inspectionRef.current = null;
      setDateOptions([]);
      setSelectedDate("");
      setApprovalOpen(false);
      setPhase("unsupported");
      setMessage(reason);
    };
    const activated = (info: chrome.tabs.OnActivatedInfo) => {
      if (inspectionRef.current && info.tabId !== inspectionRef.current.tabId) invalidate("The active tab changed. Inspect the demo again before choosing a date.");
    };
    const updated = (tabId: number, changeInfo: { url?: string; status?: string }) => {
      if (inspectionRef.current?.tabId === tabId && (changeInfo.url || changeInfo.status === "loading")) invalidate("The inspected page navigated or reloaded. Inspect it again before recovering.");
    };
    chrome.tabs.onActivated.addListener(activated);
    chrome.tabs.onUpdated.addListener(updated);
    return () => { chrome.tabs.onActivated.removeListener(activated); chrome.tabs.onUpdated.removeListener(updated); };
  }, []);

  async function inspect() {
    if (busyRef.current) return;
    setPhase("inspecting"); setMessage(""); setOutcome(null); setObserved(null);
    inspectionRef.current = null; setDateOptions([]); setSelectedDate("");
    try {
      const tab = await activeDemoTab();
      const result = await chrome.scripting.executeScript({ target: { tabId: tab.id! }, func: inspectOrRecoverPage, args: ["inspect"] });
      const snapshot = result[0]?.result as PageSnapshot | undefined;
      const detection = classifyInspection(snapshot);
      if (detection.status !== "supported" || !snapshot?.fingerprint || tab.id === undefined || tab.windowId === undefined || !tab.url) {
        setPhase("unsupported"); setMessage(detection.reason); return;
      }
      const details = snapshot.dateOptions ?? [];
      const nextInspection: Inspection = {
        tabId: tab.id, windowId: tab.windowId, url: tab.url, fingerprint: snapshot.fingerprint,
        availableDates: snapshot.availableDates ?? [], dateOptions: details,
      };
      inspectionRef.current = nextInspection; setDateOptions(details);
      setSelectedDate(details[0]?.date ?? ""); setPhase("ready"); setMessage(detection.reason);
    } catch (error) {
      inspectionRef.current = null; setPhase("unsupported");
      setMessage(error instanceof Error ? error.message : "This page cannot be inspected safely.");
    }
  }

  function openApproval() {
    const current = inspectionRef.current;
    const option = dateOptions.find((candidate) => candidate.date === selectedDate);
    if (!current || !option || !current.availableDates.includes(option.date)) {
      setPhase("unsupported"); setMessage("Inspect the page again before requesting a recovery."); return;
    }
    setApprovedAction({ ...current, date: option.date, title: option.title });
    setApprovalOpen(true);
  }

  function cancelApproval() {
    setApprovalOpen(false); setApprovedAction(null); setPhase("cancelled"); setMessage("Cancelled — no page changes were made.");
  }

  async function approveRecovery() {
    if (busyRef.current || !approvedAction) return;
    busyRef.current = true;
    setApprovalOpen(false); setPhase("recovering"); setOutcome(null); setObserved(null);
    const action = approvedAction;
    try {
      const activeTab = await activeDemoTab();
      if (activeTab.id === undefined || activeTab.windowId === undefined) throw new Error("The approved tab is no longer available.");
      if (action.tabId !== activeTab.id || action.windowId !== activeTab.windowId || action.url !== activeTab.url) {
        throw new Error("The active tab changed after approval. No recovery was applied.");
      }
      const currentSnapshotResult = await chrome.scripting.executeScript({ target: { tabId: action.tabId }, func: inspectOrRecoverPage, args: ["inspect"] });
      const currentSnapshot = currentSnapshotResult[0]?.result as PageSnapshot | undefined;
      const fresh = {
        tabId: action.tabId, windowId: action.windowId, url: currentSnapshot?.url ?? "",
        fingerprint: currentSnapshot?.fingerprint ?? "", date: action.date,
        availableDates: currentSnapshot?.availableDates ?? [],
      };
      if (classifyInspection(currentSnapshot).status !== "supported" || !isApprovalCurrent(action, fresh)) throw new Error("The page or date list changed after approval. Inspect again to continue.");
      setPhase("recovering");
      const appliedResult = await chrome.scripting.executeScript({ target: { tabId: action.tabId }, func: inspectOrRecoverPage, args: ["recover", action.fingerprint, action.date] });
      const applied = appliedResult[0]?.result as PageSnapshot | undefined;
      if (!applied?.attempted) throw new Error(applied?.reason ?? "The page did not provide the approved date option.");
      setPhase("verifying");
      const checkedResult = await chrome.scripting.executeScript({ target: { tabId: action.tabId }, func: readPageOutcome, args: [action.date] });
      const checked = checkedResult[0]?.result as PageSnapshot | undefined;
      const status = verifyOutcome(checked as Parameters<typeof verifyOutcome>[0], action.date);
      setObserved(checked ?? null); setOutcome(status); setPhase("result");
      setMessage(status === "accepted"
        ? "The form shows the approved date and its matching validation state. The form was not submitted."
        : status === "unsupported"
          ? "The page did not expose the visible evidence needed to verify this action. Continue manually."
          : "The observed field or validation state did not match the approved date. Continue manually.");
    } catch (error) {
      setOutcome("unsupported"); setObserved(null); setPhase("result");
      setMessage(error instanceof Error ? error.message : "The page interaction could not be verified.");
    } finally {
      busyRef.current = false;
    }
  }

  function onModalKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") { event.preventDefault(); cancelApproval(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...(modalRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? [])];
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  const statusLabel = outcome === "accepted" ? "Accepted" : outcome === "failed" ? "Not confirmed" : "Unsupported";
  const steps = ["Detect", "Understand", "Recover", "Verify"];
  const completed = phase === "ready" || phase === "cancelled" ? 2 : phase === "recovering" ? 2 : phase === "verifying" ? 3 : phase === "result" ? 4 : phase === "unsupported" ? 1 : phase === "inspecting" ? 1 : 0;

  return (
    <main className="panel-shell">
      <header className="panel-header">
        <div className="panel-brand"><b>STEPRECOVER</b><span>YOUR NEXT STEP, WITH YOU</span></div>
        <span className="panel-mode"><i /> LOCAL DEMO</span>
      </header>
      <section className="panel-intro">
        <p className="panel-kicker">CONTROLLED DEMONSTRATION</p>
        <h1>One careful<br />step forward.</h1>
        <p>StepRecover checks this local form for one known date-selection obstacle.</p>
      </section>
      <ol className="journey" aria-label="StepRecover process">
        {steps.map((step, index) => <li key={step} className={index < completed ? "done" : index === completed && completed < 4 ? "current" : ""}><span>{index + 1}</span>{step}</li>)}
      </ol>
      <section className="panel-card" aria-live="polite">
        {(phase === "idle" || phase === "inspecting") && <>
          <div className={`signal-icon${phase === "inspecting" ? " pulse" : ""}`} aria-hidden="true">{phase === "inspecting" ? "◌" : "⌕"}</div>
          <h2>{phase === "inspecting" ? "Checking the page" : "Start with this page"}</h2>
          <p>{phase === "inspecting" ? "Looking only for the supported workshop date picker." : "Inspection reads date-picker signals in the active local training form."}</p>
          {phase === "idle" && <button className="primary-button" type="button" onClick={inspect}>Inspect this page <span aria-hidden="true">→</span></button>}
        </>}
        {phase === "ready" && <>
          <div className="status-chip"><i /> OBSTACLE FOUND</div>
          <h2>The choices need a mouse</h2><p>{message} No other page issue is being assessed.</p>
          <fieldset className="date-choice"><legend>Choose an accessible alternative</legend>
            {dateOptions.map((option, index) => <label key={option.date} className={selectedDate === option.date ? "choice selected" : "choice"}>
              <input autoFocus={index === 0} type="radio" name="recovery-date" value={option.date} checked={selectedDate === option.date} onChange={() => setSelectedDate(option.date)} />
              <span><b>{option.title}</b><small>{option.date}</small></span>
            </label>)}
          </fieldset>
          <button ref={reviewButtonRef} className="primary-button" type="button" disabled={!selectedDate} onClick={openApproval}>Review recovery <span aria-hidden="true">→</span></button>
          <p className="panel-footnote">Nothing changes until you approve.</p>
        </>}
        {phase === "unsupported" && <>
          <div className="result-icon quiet" aria-hidden="true">i</div>
          <h2 ref={resultHeadingRef} tabIndex={-1}>Can’t safely help here</h2><p>{message}</p>
          <p className="panel-footnote">Continue manually. This prototype supports one controlled pattern only.</p>
          <button className="secondary-button" type="button" onClick={inspect}>Inspect again</button>
        </>}
        {phase === "cancelled" && <>
          <div className="result-icon quiet" aria-hidden="true">↩</div><div className="result-chip quiet">CANCELLED</div>
          <h2 ref={resultHeadingRef} tabIndex={-1}>No page changes</h2><p>{message}</p>
          <button className="secondary-button" type="button" onClick={() => setPhase("ready")}>Return to date choices</button>
        </>}
        {(phase === "recovering" || phase === "verifying") && <>
          <div className="signal-icon pulse" aria-hidden="true">◌</div>
          <h2>{phase === "recovering" ? "Applying your choice" : "Checking the result"}</h2>
          <p>{phase === "recovering" ? "Using the approved date on the inspected page." : "Waiting briefly for the page’s visible validation response."}</p>
        </>}
        {phase === "result" && <>
          <div className={`result-icon ${outcome ?? ""}`} aria-hidden="true">{outcome === "accepted" ? "✓" : outcome === "failed" ? "!" : "i"}</div>
          <div className={`result-chip ${outcome ?? ""}`}>{statusLabel.toUpperCase()}</div>
          <h2 ref={resultHeadingRef} tabIndex={-1}>{outcome === "accepted" ? "The date is in place" : outcome === "failed" ? "The page did not confirm" : "Continue manually"}</h2>
          <p>{message}</p>
          <div className="evidence-card" aria-label="Observed outcome evidence">
            <b>WHAT THE PAGE SHOWS</b>
            <div><span>Approved date</span><strong>{approvedAction?.title ?? "—"}</strong></div>
            <div><span>Observed field</span><strong>{observed?.fieldValue || "Empty"}</strong></div>
            <div><span>Validation</span><strong>{observed?.statusText || "Not available"}</strong></div>
            <div><span>Form submitted</span><strong>No</strong></div>
          </div>
          <button className="secondary-button" type="button" onClick={inspect}>Inspect again</button>
        </>}
      </section>
      <aside className="safety-note"><span aria-hidden="true">✓</span><p><b>You stay in control.</b><br />Only this local page is checked. The form is never submitted.</p></aside>
      <p className="panel-version">TEAM X · TRACK 02 · LOCAL PROTOTYPE</p>
      {approvalOpen && approvedAction && <div className="modal-backdrop">
        <section ref={modalRef} className="approval-modal" role="dialog" aria-modal="true" aria-labelledby="approval-title" aria-describedby="approval-description" onKeyDown={onModalKeyDown}>
          <div className="modal-eyebrow">YOUR APPROVAL IS REQUIRED</div>
          <h2 id="approval-title">Review this recovery</h2>
          <p id="approval-description">StepRecover will select the date below on the inspected local form.</p>
          <dl>
            <div><dt>Proposed action</dt><dd>Select the requested session date</dd></div>
            <div><dt>Target field</dt><dd>Session date</dd></div>
            <div><dt>Selected value</dt><dd>{approvedAction.title}</dd></div>
          </dl>
          <button className="primary-button" type="button" onClick={approveRecovery}>Approve recovery <span aria-hidden="true">→</span></button>
          <button ref={cancelButtonRef} className="cancel-button" type="button" onClick={cancelApproval}>Cancel</button>
        </section>
      </div>}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Panel />);
