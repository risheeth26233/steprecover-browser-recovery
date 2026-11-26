import test from "node:test";
import assert from "node:assert/strict";
import { classifyInspection, isApprovalCurrent, verifyOutcome } from "../src/core.mjs";

const dates = ["2026-11-26", "2026-11-27"];
const supportedSignals = {
  controlledDemo: true,
  pickerVisible: true,
  evidenceAvailable: true,
  availableDates: dates,
  keyboardFocusableOptions: 0,
  dateFieldLabel: "Session date",
};

test("detects only a visible controlled picker with valid dynamic date evidence", () => {
  assert.equal(classifyInspection(supportedSignals).status, "supported");
  assert.equal(classifyInspection({ ...supportedSignals, controlledDemo: false }).status, "unsupported");
  assert.equal(classifyInspection({ ...supportedSignals, availableDates: ["not-a-date"] }).status, "unsupported");
  assert.equal(classifyInspection({ ...supportedSignals, availableDates: [...dates, "not-a-date"] }).status, "unsupported");
  assert.equal(classifyInspection({ ...supportedSignals, availableDates: [dates[0], dates[0]] }).status, "unsupported");
  assert.equal(classifyInspection({ ...supportedSignals, pickerVisible: false }).status, "unsupported");
  assert.equal(classifyInspection({ ...supportedSignals, evidenceAvailable: false }).status, "unsupported");
  assert.equal(classifyInspection({ ...supportedSignals, keyboardFocusableOptions: 1 }).status, "unsupported");
});

test("approval is bound to the original tab, page, picker and date", () => {
  const approval = { tabId: 8, windowId: 2, url: "http://localhost:4173/", fingerprint: "abc", date: dates[0] };
  const current = { ...approval, availableDates: dates };
  assert.equal(isApprovalCurrent(approval, current), true);
  assert.equal(isApprovalCurrent(approval, { ...current, tabId: 9 }), false);
  assert.equal(isApprovalCurrent(approval, { ...current, windowId: 3 }), false);
  assert.equal(isApprovalCurrent(approval, { ...current, url: "http://localhost:4173/other" }), false);
  assert.equal(isApprovalCurrent(approval, { ...current, fingerprint: "changed" }), false);
  assert.equal(isApprovalCurrent(approval, { ...current, availableDates: [dates[1]] }), false);
});

test("reports accepted only when exact field and validation evidence agree", () => {
  const date = dates[0];
  const completeEvidence = {
    supported: true,
    evidenceAvailable: true,
    accepted: true,
    fieldValue: date,
    validationState: "accepted",
    statusText: "Session date selected.",
  };
  assert.equal(verifyOutcome(completeEvidence, date), "accepted");
  assert.equal(verifyOutcome({ ...completeEvidence, fieldValue: dates[1] }, date), "failed");
  assert.equal(verifyOutcome({ ...completeEvidence, validationState: "pending" }, date), "failed");
  assert.equal(verifyOutcome({ ...completeEvidence, evidenceAvailable: false }, date), "unsupported");
  assert.equal(verifyOutcome({ supported: false }, date), "unsupported");
});
