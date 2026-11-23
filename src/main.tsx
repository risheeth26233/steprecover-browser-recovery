import { useState } from "react";
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

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="StepRecover demo home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>STEP<span className="brand-accent">RECOVER</span></span>
        </a>
        <div className="demo-tag"><span className="live-dot" /> CONTROLLED ACCESSIBILITY DEMO</div>
      </header>

      <section className="hero" id="main">
        <div className="hero-copy">
          <p className="eyebrow">DESIGNING FOR EVERY NEXT STEP</p>
          <h1>Make room for<br /><span>everyone.</span></h1>
          <p className="hero-intro">A small, controlled demonstration of how StepRecover can help when a web interaction gets in the way.</p>
          <div className="privacy-note"><span aria-hidden="true">⌁</span> This local demo uses synthetic information and never submits the form.</div>
        </div>

        <section className="registration-card" aria-labelledby="form-heading">
          <div className="form-heading-row">
            <div>
              <p className="eyebrow">WORKSHOP · 01</p>
              <h2 id="form-heading">Reserve your place</h2>
            </div>
            <span className="step-count">01 <i>/ 02</i></span>
          </div>
          <p className="form-intro">Leave a few details to see the StepRecover demo in action.</p>

          <form data-steprecover-demo="true" noValidate>
            <label className="field-label" htmlFor="attendee-name">Your name</label>
            <input id="attendee-name" name="name" type="text" autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter a name" />

            <label className="field-label" htmlFor="attendee-email">Email address</label>
            <input id="attendee-email" name="email" type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />

            <label className="field-label date-label" htmlFor="session-date">Session date <span>REQUIRED</span></label>
            <input id="session-date" name="sessionDate" type="text" readOnly value={selectedDate} placeholder="Choose a session" aria-describedby="picker-help session-status" />
            <p id="picker-help" className="field-help">Training sample: these visible date options intentionally cannot receive keyboard focus. Use a mouse, or try StepRecover.</p>

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
                  <span className="session-copy"><b>{session.weekday}</b><small>November–December · {session.time}</small></span>
                  <span className="session-check" aria-hidden="true">{selectedDate === session.date ? "✓" : ""}</span>
                </div>
              ))}
            </div>
            <p className="form-status" id="session-status" data-steprecover-status aria-live="polite" data-validation-state={selectedDate ? "accepted" : "pending"}>
              {selectedDate ? "Session date selected." : "Choose a session to continue."}
            </p>
          </form>
          <div className="form-footnote"><span aria-hidden="true">✦</span> Your next step stays yours. StepRecover will never submit this form.</div>
        </section>
      </section>

      <section className="flow-strip" aria-label="StepRecover process">
        <div className="flow-intro"><span className="flow-icon" aria-hidden="true">↗</span><span>ONE THOUGHTFUL STEP AT A TIME</span></div>
        {[["01", "DETECT"], ["02", "UNDERSTAND"], ["03", "RECOVER"], ["04", "VERIFY"]].map(([n, label], index) => (
          <div className="flow-step" key={label}><span className="flow-number">{n}</span><span>{label}</span>{index < 3 && <span className="flow-arrow" aria-hidden="true">→</span>}</div>
        ))}
      </section>
      <footer className="footer"><span>STEPRECOVER · TEAM X</span><span>TRACK 02 — BEYOND THE BROWSER</span><span>DEMO ONLY · NOT A REAL REGISTRATION</span></footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<RegistrationDemo />);
