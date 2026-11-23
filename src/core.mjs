export function classifyInspection(signals) {
  if (!signals?.controlledDemo) {
    return { status: "unsupported", reason: "This tab is not the controlled StepRecover form." };
  }
  if (!signals.pickerVisible || signals.optionCount < 1 || !signals.dateFieldLabel) {
    return { status: "unsupported", reason: "The expected date-picker signals are incomplete." };
  }
  if (signals.keyboardFocusableOptions !== 0) {
    return { status: "unsupported", reason: "The picker does not match the supported keyboard-accessibility pattern." };
  }
  return { status: "supported", reason: "The visible date choices cannot receive keyboard focus." };
}

export function verifyOutcome(observation, proposedDate) {
  if (!observation?.supported) return "unsupported";
  return observation.accepted === true && observation.fieldValue === proposedDate
    ? "accepted"
    : "failed";
}
