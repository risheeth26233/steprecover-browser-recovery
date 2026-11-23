import test from "node:test";
import assert from "node:assert/strict";
import { classifyInspection, verifyOutcome } from "../src/core.mjs";

test("detects only the controlled picker with no keyboard-focusable choices", () => {
  assert.equal(classifyInspection({
    controlledDemo: true,
    pickerVisible: true,
    optionCount: 3,
    keyboardFocusableOptions: 0,
    dateFieldLabel: "Session date",
  }).status, "supported");
  assert.equal(classifyInspection({ controlledDemo: false }).status, "unsupported");
  assert.equal(classifyInspection({
    controlledDemo: true, pickerVisible: true, optionCount: 3,
    keyboardFocusableOptions: 1, dateFieldLabel: "Session date",
  }).status, "unsupported");
});

test("accepts only the exact page-observed date and validation signal", () => {
  const date = "2026-11-26";
  assert.equal(verifyOutcome({
    supported: true, accepted: true, fieldValue: date,
  }, date), "accepted");
  assert.equal(verifyOutcome({
    supported: true, accepted: false, fieldValue: date,
  }, date), "failed");
  assert.equal(verifyOutcome({ supported: false }, date), "unsupported");
});
