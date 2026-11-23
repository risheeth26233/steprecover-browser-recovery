export type Detection = { status: "supported" | "unsupported"; reason: string };
export type Outcome = "accepted" | "failed" | "unsupported";
export function classifyInspection(signals: unknown): Detection;
export function verifyOutcome(observation: unknown, proposedDate: string): Outcome;
