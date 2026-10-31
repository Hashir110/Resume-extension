import { describe, expect, it } from "vitest";
import { parseHtml } from "../../test-utils";
import { linkedInAdapter } from "./linkedin";

const URL = "https://www.linkedin.com/jobs/view/12345";

describe("linkedInAdapter", () => {
  it("extracts title, company, location, and description", () => {
    const doc = parseHtml(`
      <h1 class="top-card-layout__title">Senior Frontend Engineer</h1>
      <a class="topcard__org-name-link">Acme Corp</a>
      <span class="topcard__flavor--bullet">Remote</span>
      <div class="jobs-description__content">We are looking for a frontend engineer.</div>
    `);

    const result = linkedInAdapter.extractJob(doc, URL);
    expect(result).toEqual({
      title: "Senior Frontend Engineer",
      company: "Acme Corp",
      location: "Remote",
      description: "We are looking for a frontend engineer.",
    });
  });

  it("degrades gracefully when company/location are missing", () => {
    const doc = parseHtml(`
      <h1>Senior Frontend Engineer</h1>
      <div class="jobs-description__content">We are looking for a frontend engineer.</div>
    `);

    const result = linkedInAdapter.extractJob(doc, URL);
    expect(result?.title).toBe("Senior Frontend Engineer");
    expect(result?.company).toBeUndefined();
    expect(result?.description).toContain("frontend engineer");
  });

  it("returns null when the description cannot be found at all", () => {
    const doc = parseHtml(`<h1>Senior Frontend Engineer</h1>`);
    expect(linkedInAdapter.extractJob(doc, URL)).toBeNull();
  });

  it("does not throw on a malformed/empty document", () => {
    const doc = parseHtml("");
    expect(() => linkedInAdapter.extractJob(doc, URL)).not.toThrow();
    expect(linkedInAdapter.extractJob(doc, URL)).toBeNull();
  });
});
