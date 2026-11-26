import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const sessions = [
  { date: "2026-11-26", weekday: "Thursday", month: "NOV", day: "26", time: "10:00 AM" },
  { date: "2026-11-27", weekday: "Friday", month: "NOV", day: "27", time: "2:30 PM" },
  { date: "2026-12-03", weekday: "Thursday", month: "DEC", day: "03", time: "11:00 AM" },
];

function RegistrationDemo() {
  const [selectedDate, setSelectedDate] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  function resetDemo() {
    setName("");
    setEmail("");
    setSelectedDate("");
    nameRef.current?.focus();
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="StepRecover demo home">
          <span>STEP<span className="brand-accent">RECOVER</span></span>
        </a>
        <div className="demo-tag"><span className="live-dot" /> LOCAL ACCESSIBILITY DEMO</div>
      </header>

      <section className="hero" id="main">
        <div className="hero-copy">
          <p className="eyebrow">A MORE ACCESSIBLE WAY THROUGH</p>
          <h1>Every next step<br /><span>should be yours.</span></h1>
          <p className="hero-intro">A controlled demonstration of user-approved help when a date picker gets in the way.</p>
          <div className="privacy-note"><span className="privacy-mark" aria-hidden="true">✓</span><span><b>Private by design</b><br />Synthetic details only. This form is never submitted.</span></div>
        </div>

        <section className="registration-card" aria-labelledby="form-heading">
          <div className="form-heading-row">
            <div>
              <p className="eyebrow">STEPRECOVER WORKSHOP · LOCAL DEMO</p>
              <h2 id="form-heading">Choose a session</h2>
            </div>
            <span className="step-count">DEMO FORM</span>
          </div>
          <p className="form-intro">Try the registration flow. No real booking will be made.</p>

          <form data-steprecover-demo="true" noValidate onSubmit={(event) => event.preventDefault()}>
            <label className="field-label" htmlFor="attendee-name">Your name</label>
            <input ref={nameRef} id="attendee-name" name="name" type="text" autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter a name" />

            <label className="field-label" htmlFor="attendee-email">Email address</label>
            <input id="attendee-email" name="email" type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />

            <label className="field-label date-label" htmlFor="session-date">Session date <span>REQUIRED</span></label>
            <input id="session-date" name="sessionDate" type="text" readOnly value={selectedDate} placeholder="Choose a session" aria-describedby="picker-help session-status" />
            <p id="picker-help" className="field-help">Training sample: these session choices are intentionally unavailable to keyboard navigation. Use a mouse, or ask StepRecover for help.</p>

            <div className="session-picker" data-steprecover-picker role="listbox" aria-label="Workshop session dates">
              {sessions.map((session) => (
                <div
                  key={session.date}
                  className={`session-option${selectedDate === session.date ? " selected" : ""}`}
                  role="option"
                  aria-selected={selectedDate === session.date}
                  data-steprecover-date={session.date}
                  onClick={() => setSelectedDate(session.date)}
                >
                  <span className="session-date"><b>{session.day}</b><small>{session.month}</small></span>
                  <span className="session-copy"><b>{session.weekday}, {session.month === "NOV" ? "November" : "December"} {session.day}</b><small>Workshop session · {session.time}</small></span>
                  <span className="session-check" aria-hidden="true">{selectedDate === session.date ? "✓" : ""}</span>
                </div>
              ))}
            </div>
            <p className="form-status" id="session-status" data-steprecover-status aria-live="polite" data-validation-state={selectedDate ? "accepted" : "pending"}>
              {selectedDate ? "Session date selected." : "Choose a session to continue."}
            </p>
            <button className="reset-button" type="button" onClick={resetDemo}>Reset demo</button>
          </form>
          <div className="form-footnote"><span aria-hidden="true">✓</span> Controlled training form · No registration or submission.</div>
        </section>
      </section>

      <section className="flow-strip" aria-label="StepRecover process">
        <div className="flow-intro"><span className="flow-icon" aria-hidden="true">01</span><span>ONE CAREFUL STEP AT A TIME</span></div>
        {[["01", "Detect"], ["02", "Understand"], ["03", "Recover"], ["04", "Verify"]].map(([n, label], index) => (
          <div className="flow-step" key={label}><span className="flow-number">{n}</span><span>{label}</span>{index < 3 && <span className="flow-arrow" aria-hidden="true">→</span>}</div>
        ))}
      </section>
      <footer className="footer"><span>STEPRECOVER · TEAM X</span><span>TRACK 02 — BEYOND THE BROWSER</span><span>DEMO ONLY · NOT A REAL REGISTRATION</span></footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<RegistrationDemo />);
