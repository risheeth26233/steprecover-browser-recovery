import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { classifyInspection, verifyOutcome } from "../../src/core.mjs";
import "./panel.css";

type Phase = "idle" | "unsupported" | "ready" | "working" | "result";
type Outcome = "accepted" | "failed" | "unsupported";
type Session = { date: string; title: string };

const sessions: Session[] = [
  { date: "2026-11-26", title: "Thursday, November 26" },
  { date: "2026-11-27", title: "Friday, November 27" },
  { date: "2026-12-03", title: "Thursday, December 3" },
];

async function activeDemoTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) throw new Error("No active browser tab is available.");
  const url = new URL(tab.url);
  if (url.origin !== "http://localhost:4173") throw new Error("Open the local StepRecover demo at http://localhost:4173 first.");
  return tab;
}

function Panel() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(sessions[0].date);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const reviewButtonRef = useRef<HTMLButtonElement>(null);
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const firstDateRef = useRef<HTMLInputElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (approvalOpen) approveButtonRef.current?.focus();
    if (phase === "ready") firstDateRef.current?.focus();
    if (phase === "result") resultHeadingRef.current?.focus();
  }, [approvalOpen, phase]);

  async function inspect() {
    setPhase("working");
    setMessage("");
    setOutcome(null);
    try {
      const tab = await activeDemoTab();
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => {
          const inspect = (document as Document & { __stepRecoverInspect?: () => unknown }).__stepRecoverInspect;
          if (inspect) return inspect();
          return (() => {
            const form = document.querySelector('form[data-steprecover-demo="true"]');
            if (!form) return { controlledDemo: false };
            const options = [...form.querySelectorAll("[data-steprecover-date]")];
            return {
              controlledDemo: true,
              dateFieldLabel: form.querySelector('label[for="session-date"]')?.textContent?.trim() ?? "",
              optionCount: options.length,
              keyboardFocusableOptions: options.filter((option) => (option as HTMLElement).tabIndex >= 0).length,
              fieldValue: (form.querySelector("#session-date") as HTMLInputElement | null)?.value ?? "",
              pickerVisible: options.length > 0,
            };
          })();
        },
      });
      const detection = classifyInspection(result[0]?.result);
      if (detection.status !== "supported") {
        setPhase("unsupported");
        setMessage(detection.reason);
        return;
      }
      setPhase("ready");
      setMessage(detection.reason);
    } catch (error) {
      setPhase("unsupported");
      setMessage(error instanceof Error ? error.message : "This page cannot be inspected safely.");
    }
  }

  async function approveRecovery() {
    setApprovalOpen(false);
    setPhase("working");
    try {
      const tab = await activeDemoTab();
      const applied = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: (isoDate: string) => {
          const form = document.querySelector('form[data-steprecover-demo="true"]');
          if (!form) return { attempted: false, reason: "controlled-form-missing" };
          const option = [...form.querySelectorAll("[data-steprecover-date]")]
            .find((candidate) => candidate.getAttribute("data-steprecover-date") === isoDate);
          if (!option) return { attempted: false, reason: "date-not-available" };
          (option as HTMLElement).click();
          return { attempted: true };
        },
        args: [selectedDate],
      });
      if (!applied[0]?.result?.attempted) {
        setPhase("result");
        setOutcome("failed");
        setMessage("The page did not provide the approved date option.");
        return;
      }
      const checked = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: (isoDate: string) => {
          const form = document.querySelector('form[data-steprecover-demo="true"]');
          if (!form) return { supported: false };
          const input = form.querySelector("#session-date") as HTMLInputElement | null;
          const status = form.querySelector("[data-steprecover-status]");
          const fieldValue = input?.value ?? "";
          const validationState = status?.getAttribute("data-validation-state") ?? "";
          const statusText = status?.textContent?.trim() ?? "";
          return {
            supported: true,
            fieldValue,
            accepted: fieldValue === isoDate && validationState === "accepted" && statusText === "Session date selected.",
          };
        },
        args: [selectedDate],
      });
      const checkedPage = checked[0]?.result;
      const status = verifyOutcome(checkedPage, selectedDate);
      setPhase("result");
      setOutcome(status);
      setMessage(status === "accepted"
        ? "The controlled form shows the requested date and its selection status. The form was not submitted."
        : "The page did not show enough evidence to confirm the requested date was accepted.");
    } catch (error) {
      setPhase("result");
      setOutcome("unsupported");
      setMessage(error instanceof Error ? error.message : "The page interaction could not be verified.");
    }
  }

  const statusLabel = outcome === "accepted" ? "Accepted" : outcome === "failed" ? "Failed" : "Unsupported";

  return (
    <main className="panel-shell">
      <header className="panel-header">
        <span className="panel-logo" aria-hidden="true">S</span>
        <div><p>STEPRECOVER</p><span>YOUR NEXT STEP, WITH YOU</span></div>
        <span className="panel-dot" aria-label="Local demo mode" title="Local demo mode" />
      </header>

      <section className="panel-intro">
        <p className="panel-kicker">CONTROLLED DEMONSTRATION</p>
        <h1>Let’s get past<br />the stuck part.</h1>
        <p>StepRecover checks this page for one known date-selection obstacle.</p>
      </section>

      <ol className="journey" aria-label="StepRecover process">
        {["Detect", "Understand", "Recover", "Verify"].map((step, index) => (
          <li key={step} className={index === 0 && phase !== "idle" ? "current" : index === 2 && phase === "working" ? "current" : phase === "result" && index < 4 ? "done" : ""}>
            <span>{index + 1}</span>{step}
          </li>
        ))}
      </ol>

      <section className="panel-card" aria-live="polite">
        {phase === "idle" && <>
          <div className="signal-icon" aria-hidden="true">⌕</div>
          <h2>Start with this page</h2>
          <p>Inspection reads only the date-picker signals in the active, local training form.</p>
          <button className="primary-button" type="button" onClick={inspect}>Inspect this page <span aria-hidden="true">→</span></button>
        </>}
        {phase === "working" && <>
          <div className="signal-icon pulse" aria-hidden="true">◌</div>
          <h2>Checking the page</h2><p>Looking for the supported workshop date picker.</p>
        </>}
        {phase === "ready" && <>
          <div className="status-chip"><span className="status-dot" /> OBSTACLE FOUND</div>
          <h2>The date choices need a mouse</h2>
          <p>{message} No other page issue is being assessed.</p>
          <fieldset className="date-choice">
            <legend>Choose an accessible alternative</legend>
            {sessions.map((session, index) => (
              <label key={session.date} className={selectedDate === session.date ? "choice selected" : "choice"}>
                <input ref={index === 0 ? firstDateRef : undefined} type="radio" name="recovery-date" value={session.date} checked={selectedDate === session.date} onChange={() => setSelectedDate(session.date)} />
                <span><b>{session.title}</b><small>{session.date}</small></span>
              </label>
            ))}
          </fieldset>
          <button ref={reviewButtonRef} className="primary-button" type="button" onClick={() => setApprovalOpen(true)}>Review recovery <span aria-hidden="true">→</span></button>
          <p className="panel-footnote">Nothing changes until you approve.</p>
        </>}
        {phase === "unsupported" && <>
          <div className="result-icon quiet" aria-hidden="true">i</div>
          <h2>Can’t safely help here</h2><p>{message}</p>
          <p className="panel-footnote">Continue manually. This prototype supports one controlled pattern only.</p>
        </>}
        {phase === "result" && <>
          <div className={`result-icon ${outcome ?? ""}`} aria-hidden="true">{outcome === "accepted" ? "✓" : outcome === "failed" ? "!" : "i"}</div>
          <div className={`result-chip ${outcome ?? ""}`}>{statusLabel.toUpperCase()}</div>
          <h2 ref={resultHeadingRef} tabIndex={-1}>{outcome === "accepted" ? "The date is in place" : outcome === "failed" ? "The page did not confirm" : "Continue manually"}</h2>
          <p>{message}</p>
          <button className="secondary-button" type="button" onClick={inspect}>Check again</button>
        </>}
      </section>

      <aside className="safety-note"><span aria-hidden="true">⌑</span><p><b>You stay in control.</b><br />StepRecover never submits the form or reads other tabs.</p></aside>
      <p className="panel-version">TEAM X · TRACK 02 · LOCAL PROTOTYPE</p>

      {approvalOpen && (
        <div className="modal-backdrop">
          <section className="approval-modal" role="dialog" aria-modal="true" aria-labelledby="approval-title" aria-describedby="approval-description" onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); setApprovalOpen(false); reviewButtonRef.current?.focus(); }
            if (event.key === "Tab") {
              const buttons = event.currentTarget.querySelectorAll("button");
              const first = buttons[0]; const last = buttons[buttons.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
              if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
          }}>
            <div className="modal-eyebrow">YOUR APPROVAL IS REQUIRED</div>
            <h2 id="approval-title">Review this recovery</h2>
            <p id="approval-description">StepRecover will select the date below using a choice supported by this controlled form.</p>
            <dl>
              <div><dt>Proposed action</dt><dd>Select the requested session date</dd></div>
              <div><dt>Target field</dt><dd>Session date</dd></div>
              <div><dt>Selected value</dt><dd>{sessions.find((session) => session.date === selectedDate)?.title ?? selectedDate}</dd></div>
            </dl>
            <button ref={approveButtonRef} className="primary-button" type="button" onClick={approveRecovery}>Approve recovery <span aria-hidden="true">→</span></button>
            <button className="cancel-button" type="button" onClick={() => { setApprovalOpen(false); reviewButtonRef.current?.focus(); }}>Cancel</button>
          </section>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Panel />);
