import { describe, expect, it } from "vitest";
import { detectJobSections } from "../../lib/job/normalize";
import { parseHtml } from "../../test-utils";
import { genericAdapter } from "./generic";

const URL = "http://localhost:3000/dev-job";

// Mirrors app/dev-job/page.tsx's real DOM shape exactly (semantic
// main > article > header/section > h1/h2/ul/li). Regression coverage for
// two bugs found in this exact flow:
//   1. `.textContent` squashed everything into one run-on line with no
//      heading our backend parser could recognize (fixed: text-extraction.ts
//      wraps block-level elements in newlines).
//   2. Real <li> bullets carry no literal "-"/"•" character (that's a
//      CSS-rendered marker, not text) — without a synthetic bullet prefix,
//      the backend's job parser (src/lib/job/normalize.ts) treats multiple
//      list-item lines as ONE combined, unmatched requirement instead of
//      separate ones (fixed: text-extraction.ts prefixes each <li> with "- ").
function buildDevJobDom() {
  return parseHtml(`
    <html><body>
      <main class="mx-auto max-w-3xl px-6 py-10">
        <article>
          <header>
            <h1>Senior Frontend Engineer</h1>
            <div>Acme Technologies</div>
            <div>Remote — Full Time</div>
          </header>
          <section>
            <h2>About the Role</h2>
            <p>Acme Technologies is looking for a Senior Frontend Engineer to help build and scale our customer-facing web applications.</p>
          </section>
          <section>
            <h2>Responsibilities</h2>
            <ul>
              <li>Build scalable React applications</li>
              <li>Develop reusable UI components</li>
              <li>Work with backend engineers</li>
            </ul>
          </section>
          <section>
            <h2>Requirements</h2>
            <ul>
              <li>React</li>
              <li>Next.js</li>
              <li>TypeScript</li>
              <li>3+ years frontend development</li>
            </ul>
          </section>
        </article>
      </main>
    </body></html>
  `);
}

describe("browser DOM -> generic adapter -> backend JobDocument sections", () => {
  it("extracts title/company and a description the backend can fully re-parse", () => {
    const doc = buildDevJobDom();
    const extracted = genericAdapter.extractJob(doc, URL);

    expect(extracted?.title).toBe("Senior Frontend Engineer");
    expect(extracted?.description).toBeTruthy();

    // This is the actual backend parser (src/lib/job/normalize.ts) — not a
    // reimplementation — proving the extracted text survives real parsing.
    const sections = detectJobSections(extracted!.description);

    const responsibilities = sections.find((s) => s.type === "responsibilities");
    const requirements = sections.find((s) => s.type === "requirements");

    // The bug this guards against: these used to come back as ONE combined,
    // run-on item (or not detected as a section at all).
    expect(responsibilities?.items.map((i) => i.text)).toEqual([
      "Build scalable React applications",
      "Develop reusable UI components",
      "Work with backend engineers",
    ]);
    expect(requirements?.items.map((i) => i.text)).toEqual([
      "React",
      "Next.js",
      "TypeScript",
      "3+ years frontend development",
    ]);
  });

  it("fails loudly if bullet separation is lost again (run-on regression guard)", () => {
    const doc = buildDevJobDom();
    const extracted = genericAdapter.extractJob(doc, URL);
    const sections = detectJobSections(extracted!.description);
    const requirements = sections.find((s) => s.type === "requirements");

    // If extraction regresses to one combined blob, this becomes 1 (or the
    // section disappears into "other" entirely) instead of 4.
    expect(requirements?.items).toHaveLength(4);
  });
});
