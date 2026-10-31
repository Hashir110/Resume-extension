import { describe, expect, it } from "vitest";
import { parseHtml } from "../../test-utils";
import { leverAdapter } from "./lever";

describe("leverAdapter", () => {
  it("extracts title/description and derives company from the URL path", () => {
    const doc = parseHtml(`
      <h2 class="posting-headline">Site Reliability Engineer</h2>
      <div class="posting-page">
        <div class="section-wrapper">Keep our systems reliable.</div>
      </div>
    `);

    const result = leverAdapter.extractJob(doc, "https://jobs.lever.co/acme/abc-123");
    expect(result?.title).toBe("Site Reliability Engineer");
    expect(result?.company).toBe("acme");
    expect(result?.description).toContain("reliable");
  });

  it("returns null without a description container", () => {
    const doc = parseHtml(`<h2>Site Reliability Engineer</h2>`);
    expect(leverAdapter.extractJob(doc, "https://jobs.lever.co/acme/abc-123")).toBeNull();
  });
});
