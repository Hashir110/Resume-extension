import { describe, expect, it } from "vitest";
import { computeCanTailor, type JobState, type TailoringState } from "./state";

const detectedJob: JobState = {
  kind: "detected",
  job: { source: "linkedin", sourceUrl: "https://x", description: "y" },
};
const idle: TailoringState = { kind: "idle" };

describe("computeCanTailor", () => {
  it("is false with no detected job", () => {
    expect(computeCanTailor({ kind: "unsupported-site" }, "resume-1", idle)).toBe(false);
  });

  it("is false with a detected job but no resume selected", () => {
    expect(computeCanTailor(detectedJob, "", idle)).toBe(false);
  });

  it("is true with a detected job and a selected resume", () => {
    expect(computeCanTailor(detectedJob, "resume-1", idle)).toBe(true);
  });

  it("is false while tailoring is already in progress", () => {
    expect(computeCanTailor(detectedJob, "resume-1", { kind: "analyzing" })).toBe(false);
  });
});
