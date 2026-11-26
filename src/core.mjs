export function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function classifyInspection(signals) {
  if (!signals?.controlledDemo) {
    return { status: "unsupported", reason: "This tab is not the controlled StepRecover form." };
  }
  const dates = Array.isArray(signals.availableDates) ? signals.availableDates : [];
  const validDates = dates.filter(isIsoDate);
  if (!signals.pickerVisible || !signals.evidenceAvailable || validDates.length < 1 || validDates.length !== dates.length || new Set(validDates).size !== validDates.length || !signals.dateFieldLabel) {
    return { status: "unsupported", reason: "The visible picker or its date evidence is incomplete." };
  }
  if (signals.keyboardFocusableOptions !== 0) {
    return { status: "unsupported", reason: "The picker does not match the supported keyboard-accessibility pattern." };
  }
  return { status: "supported", reason: "The visible date choices cannot receive keyboard focus." };
}

export function isApprovalCurrent(approved, current) {
  if (!approved || !current) return false;
  return approved.tabId === current.tabId
    && approved.windowId === current.windowId
    && approved.url === current.url
    && approved.fingerprint === current.fingerprint
    && approved.date === current.date
    && current.availableDates?.includes(approved.date) === true;
}

export function verifyOutcome(observation, proposedDate) {
  if (!observation?.supported || !observation.evidenceAvailable) return "unsupported";
  if (!isIsoDate(proposedDate) || !isIsoDate(observation.fieldValue)) return "failed";
  return observation.accepted === true
    && observation.fieldValue === proposedDate
    && observation.validationState === "accepted"
    && observation.statusText === "Session date selected."
    ? "accepted"
    : "failed";
}
