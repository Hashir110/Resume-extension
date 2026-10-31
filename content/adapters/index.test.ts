import { describe, expect, it } from "vitest";
import { genericAdapter, selectSiteAdapter } from "./index";

describe("selectSiteAdapter", () => {
  it("selects LinkedIn for a linkedin.com URL", () => {
    expect(selectSiteAdapter("https://www.linkedin.com/jobs/view/12345")?.source).toBe(
      "linkedin",
    );
  });

  it("selects Indeed for an indeed.com URL", () => {
    expect(selectSiteAdapter("https://www.indeed.com/viewjob?jk=abc")?.source).toBe("indeed");
  });

  it("selects Greenhouse for a greenhouse.io URL", () => {
    expect(selectSiteAdapter("https://boards.greenhouse.io/acme/jobs/123")?.source).toBe(
      "greenhouse",
    );
  });

  it("selects Lever for a lever.co URL", () => {
    expect(selectSiteAdapter("https://jobs.lever.co/acme/123")?.source).toBe("lever");
  });

  it("selects Workday for a myworkdayjobs.com URL", () => {
    expect(selectSiteAdapter("https://acme.myworkdayjobs.com/careers/job/123")?.source).toBe(
      "workday",
    );
  });

  it("selects Rozee for a rozee.pk URL", () => {
    expect(
      selectSiteAdapter("https://www.rozee.pk/some-job-title-karachi-jobs-123")?.source,
    ).toBe("generic-webpage");
  });

  it("falls back to the generic adapter for an unrecognized URL", () => {
    expect(selectSiteAdapter("https://example.com/careers/123")).toBe(genericAdapter);
  });
});
