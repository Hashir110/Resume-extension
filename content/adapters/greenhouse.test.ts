import { describe, expect, it } from "vitest";
import { parseHtml } from "../../test-utils";
import { greenhouseAdapter } from "./greenhouse";

const URL = "https://boards.greenhouse.io/acme/jobs/123";

describe("greenhouseAdapter", () => {
  it("extracts title, company, location, and description", () => {
    const doc = parseHtml(`
      <h1 class="app-title">Platform Engineer</h1>
      <span class="company-name">Acme Corp</span>
      <div class="location">Remote</div>
      <div id="content">Own our platform infrastructure.</div>
    `);

    expect(greenhouseAdapter.extractJob(doc, URL)).toEqual({
      title: "Platform Engineer",
      company: "Acme Corp",
      location: "Remote",
      description: "Own our platform infrastructure.",
    });
  });

  it("returns null when the page has no recognizable content container", () => {
    const doc = parseHtml(`<h1 class="app-title">Platform Engineer</h1>`);
    expect(greenhouseAdapter.extractJob(doc, URL)).toBeNull();
  });
});
