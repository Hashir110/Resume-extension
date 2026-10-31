import { describe, expect, it } from "vitest";
import { parseHtml } from "../../test-utils";
import { workdayAdapter } from "./workday";

describe("workdayAdapter", () => {
  it("extracts title/description and derives company from the hostname", () => {
    const doc = parseHtml(`
      <h1 data-automation-id="jobPostingHeader">Data Engineer</h1>
      <div data-automation-id="jobPostingDescription">Build our data pipelines.</div>
    `);

    const result = workdayAdapter.extractJob(
      doc,
      "https://acme.myworkdayjobs.com/careers/job/123",
    );
    expect(result?.title).toBe("Data Engineer");
    expect(result?.company).toBe("acme");
    expect(result?.description).toContain("data pipelines");
  });

  it("returns null without a description container", () => {
    const doc = parseHtml(`<h1 data-automation-id="jobPostingHeader">Data Engineer</h1>`);
    expect(
      workdayAdapter.extractJob(doc, "https://acme.myworkdayjobs.com/careers/job/123"),
    ).toBeNull();
  });
});
