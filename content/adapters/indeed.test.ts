import { describe, expect, it } from "vitest";
import { parseHtml } from "../../test-utils";
import { indeedAdapter } from "./indeed";

const URL = "https://www.indeed.com/viewjob?jk=abc";

describe("indeedAdapter", () => {
  it("extracts title, company, location, and description", () => {
    const doc = parseHtml(`
      <h1 class="jobsearch-JobInfoHeader-title">Backend Engineer</h1>
      <div data-testid="inlineHeader-companyName">Acme Corp</div>
      <div data-testid="inlineHeader-companyLocation">New York, NY</div>
      <div id="jobDescriptionText">Build backend services.</div>
    `);

    expect(indeedAdapter.extractJob(doc, URL)).toEqual({
      title: "Backend Engineer",
      company: "Acme Corp",
      location: "New York, NY",
      description: "Build backend services.",
    });
  });

  it("extracts from Indeed's current search-results-with-side-panel layout", () => {
    const doc = parseHtml(`
      <!-- The page's own unrelated SEO h1 — must never be picked up as the job title. -->
      <h1>full stack developer jobs in Karachi</h1>
      <div data-testid="vj-job-title">Full Stack / MERN Stack Developer</div>
      <div data-testid="company-name">Ideal Web Designer</div>
      <div class="react-native-html-content simple-job-description-html">
        <style>.foo { color: red; }</style>
        <p>We are seeking an adaptable Full-Stack MERN Developer.</p>
      </div>
    `);

    const result = indeedAdapter.extractJob(doc, URL);
    expect(result?.title).toBe("Full Stack / MERN Stack Developer");
    expect(result?.company).toBe("Ideal Web Designer");
    expect(result?.description).toContain("Full-Stack MERN Developer");
    expect(result?.description).not.toContain("color: red");
  });

  it("extracts company from the dedicated /viewjob page's metadata link", () => {
    const doc = parseHtml(`
      <h1>Junior Full-Stack Engineer</h1>
      <div data-testid="company-info-metadata">
        <a href="https://pk.indeed.com/cmp/CloudLab-Technologies">CloudLab Technologies</a>
        <div>Karachi</div>
      </div>
      <div id="jobDescriptionText">Build full-stack features.</div>
    `);

    const result = indeedAdapter.extractJob(doc, URL);
    expect(result?.company).toBe("CloudLab Technologies");
  });

  it("returns null when there's no description", () => {
    const doc = parseHtml(`<h1 class="jobsearch-JobInfoHeader-title">Backend Engineer</h1>`);
    expect(indeedAdapter.extractJob(doc, URL)).toBeNull();
  });

  it("handles a missing title without throwing", () => {
    const doc = parseHtml(`<div id="jobDescriptionText">Build backend services.</div>`);
    const result = indeedAdapter.extractJob(doc, URL);
    expect(result?.title).toBeUndefined();
    expect(result?.description).toBe("Build backend services.");
  });
});
