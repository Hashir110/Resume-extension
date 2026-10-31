import type { UsageStatus } from "../lib/api-client";
import type { DetectedJob } from "../lib/messaging";
import type { TailoringPlan } from "../shared-types";

export type AuthState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "expired" }
  | { kind: "signed-in"; email: string };

export type JobState =
  | { kind: "loading" }
  | { kind: "unsupported-site" }
  | { kind: "waiting" }
  | { kind: "failed"; reason: string }
  | { kind: "detected"; job: DetectedJob };

export type TailoringState =
  | { kind: "idle" }
  | { kind: "analyzing" }
  | { kind: "matching" }
  | { kind: "preparing" }
  | { kind: "success"; plan: TailoringPlan; usage: UsageStatus }
  // Phase 10: a distinct state (not just "error") so the panel can show the
  // calm, specific "Monthly tailoring limit reached." copy plus the actual
  // usage numbers, instead of a raw/generic error message.
  | { kind: "limit-reached"; usage: UsageStatus }
  | { kind: "error"; message: string };

export function computeCanTailor(
  jobState: JobState,
  selectedResumeId: string,
  tailoring: TailoringState,
): boolean {
  return jobState.kind === "detected" && selectedResumeId !== "" && tailoring.kind === "idle";
}

export function toJobIngestionInput(job: DetectedJob) {
  return {
    title: job.title,
    company: job.company,
    description: job.description,
    location: job.location,
    employmentType: job.employmentType,
    sourceUrl: job.sourceUrl,
  };
}
