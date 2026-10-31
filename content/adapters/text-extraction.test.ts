import { describe, expect, it } from "vitest";
import { extractTextWithLineBreaks } from "./text-extraction";

function parseHtml(html: string): Element {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  return doc.body;
}

describe("extractTextWithLineBreaks", () => {
  it("puts each list item on its own line instead of squashing them together", () => {
    const root = parseHtml("<ul><li>React</li><li>Next.js</li><li>TypeScript</li></ul>");
    expect(extractTextWithLineBreaks(root)).toBe("- React\n- Next.js\n- TypeScript");
  });

  it("marks each <li> with a synthetic bullet, since a real bullet marker is CSS, not text", () => {
    const root = parseHtml("<ul><li>React</li></ul>");
    expect(extractTextWithLineBreaks(root)).toBe("- React");
  });

  it("does not double-prefix an <li> whose text already starts with a bullet character", () => {
    const root = parseHtml("<ul><li>- Already prefixed</li><li>• Also prefixed</li></ul>");
    expect(extractTextWithLineBreaks(root)).toBe("- Already prefixed\n• Also prefixed");
  });

  it("separates headings from following paragraphs", () => {
    const root = parseHtml("<h2>Requirements</h2><p>3+ years frontend development</p>");
    expect(extractTextWithLineBreaks(root)).toBe(
      "Requirements\n3+ years frontend development",
    );
  });

  it("reproduces a realistic job-posting structure as readable lines", () => {
    const root = parseHtml(`
      <article>
        <header><h1>Senior Frontend Engineer</h1><div>Acme Technologies</div></header>
        <section><h2>Responsibilities</h2><ul><li>Build scalable React applications</li><li>Develop reusable UI components</li></ul></section>
        <section><h2>Requirements</h2><ul><li>React</li><li>Next.js</li><li>TypeScript</li></ul></section>
      </article>
    `);
    const result = extractTextWithLineBreaks(root);
    const lines = result.split("\n");

    expect(lines).toContain("Senior Frontend Engineer");
    expect(lines).toContain("Responsibilities");
    expect(lines).toContain("- Build scalable React applications");
    expect(lines).toContain("Requirements");
    expect(lines).toContain("- React");
    expect(lines).toContain("- Next.js");
    expect(lines).toContain("- TypeScript");
    // The bug this fixes: these must NOT be jammed into one token.
    expect(result).not.toContain("ReactNext.js");
    expect(result).not.toContain("RequirementsReact");
  });

  it("collapses blank lines and trims whitespace", () => {
    const root = parseHtml("<div>  Hello   world  </div><div></div><div>Next line</div>");
    expect(extractTextWithLineBreaks(root)).toBe("Hello world\nNext line");
  });

  it("leaves a simple single-line element unaffected", () => {
    const root = parseHtml("<h1>Senior Frontend Engineer</h1>");
    expect(extractTextWithLineBreaks(root)).toBe("Senior Frontend Engineer");
  });

  it("skips embedded <style> and <script> text instead of leaking it into the description", () => {
    const root = parseHtml(`
      <div>
        <style>.foo { color: red; }</style>
        <script>console.log("tracking");</script>
        <p>Real job description text.</p>
      </div>
    `);
    expect(extractTextWithLineBreaks(root)).toBe("Real job description text.");
  });
});
