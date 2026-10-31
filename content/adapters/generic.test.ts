import { describe, expect, it } from "vitest";
import { parseHtml } from "../../test-utils";
import { genericAdapter } from "./generic";

const URL = "https://example.com/careers/123";

describe("genericAdapter", () => {
  it("always canHandle (last-resort fallback)", () => {
    expect(genericAdapter.canHandle(URL)).toBe(true);
  });

  it("extracts main content while stripping nav/footer/comment noise", () => {
    const doc = parseHtml(`
      <html><head><title>Careers at Acme</title>
      <meta property="og:site_name" content="Acme Corp" />
      </head>
      <body>
        <nav>Home About Careers</nav>
        <header>Acme Corp Header</header>
        <main>
          <h1>Staff Software Engineer</h1>
          <p>${"We build reliable systems for our customers. ".repeat(5)}</p>
        </main>
        <div class="comments-section">Great opportunity, applying now!</div>
        <footer>Copyright Acme Corp</footer>
      </body></html>
    `);

    const result = genericAdapter.extractJob(doc, URL);
    expect(result?.title).toBe("Staff Software Engineer");
    expect(result?.company).toBe("Acme Corp");
    expect(result?.description).toContain("reliable systems");
    expect(result?.description).not.toContain("Home About Careers");
    expect(result?.description).not.toContain("applying now");
  });

  it("falls back to document.title when there is no h1", () => {
    const doc = parseHtml(`
      <html><head><title>Careers at Acme</title></head>
      <body><main><p>${"Long enough job description text here. ".repeat(5)}</p></main></body></html>
    `);
    const result = genericAdapter.extractJob(doc, URL);
    expect(result?.title).toBe("Careers at Acme");
  });

  it("returns null when there isn't enough content to call it a job posting", () => {
    const doc = parseHtml(`<html><body><main>Hi</main></body></html>`);
    expect(genericAdapter.extractJob(doc, URL)).toBeNull();
  });

  it("does not throw on a malformed/empty document", () => {
    const doc = parseHtml("");
    expect(() => genericAdapter.extractJob(doc, URL)).not.toThrow();
  });

  it("keeps headings and bullet lists on separate lines instead of jamming them together", () => {
    // Same shape as app/dev-job/page.tsx. Regression test for the real bug
    // behind "0 suggested changes": .textContent used to squash this into
    // one unstructured blob with no line our job parser could recognize as
    // a "Requirements"/"Responsibilities" heading.
    const doc = parseHtml(`
      <html><body>
        <main>
          <article>
            <header><h1>Senior Frontend Engineer</h1><div>Acme Technologies</div></header>
            <section><h2>Responsibilities</h2>
              <ul><li>Build scalable React applications</li><li>Develop reusable UI components</li></ul>
            </section>
            <section><h2>Requirements</h2>
              <ul><li>React</li><li>Next.js</li><li>TypeScript</li><li>3+ years frontend development</li></ul>
            </section>
          </article>
        </main>
      </body></html>
    `);

    const result = genericAdapter.extractJob(doc, URL);
    const lines = result?.description.split("\n") ?? [];

    expect(lines).toContain("Responsibilities");
    expect(lines).toContain("Requirements");
    expect(lines).toContain("- React");
    expect(lines).toContain("- Next.js");
    expect(lines).toContain("- TypeScript");
    expect(result?.description).not.toContain("RequirementsReact");
    expect(result?.description).not.toContain("ReactNext.js");
  });
});
