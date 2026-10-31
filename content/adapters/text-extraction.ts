const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "LI",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "MAIN",
  "SECTION",
  "ARTICLE",
  "HEADER",
  "FOOTER",
  "UL",
  "OL",
  "TR",
  "BR",
]);

const BULLET_PREFIX = /^[-•*•●]\s*/;

/**
 * `.textContent` concatenates every descendant text node with NO separator —
 * `<li>React</li><li>Next.js</li>` becomes "ReactNext.js". That destroys the
 * heading/bullet line structure our job-description parser (src/lib/job/
 * normalize.ts) depends on to detect "Responsibilities"/"Requirements"
 * sections, silently turning a well-structured job posting into one
 * unstructured blob with nothing recognizable in it.
 *
 * This walks the DOM and inserts a newline around each block-level element's
 * text instead, so extracted text preserves the same line structure a user
 * would visually see (and the same structure our own dev fixtures are
 * written to expect). Deterministic and works identically under jsdom
 * (tests) and a real browser — no reliance on `innerText`'s layout-dependent
 * behavior, which isn't reliably testable.
 *
 * `<li>` elements additionally get a synthetic "- " prefix. A browser's
 * rendered bullet marker (•, 1., etc.) is CSS-generated, not part of
 * `textContent`, so a real `<li>React</li>` extracts as the bare word
 * "React" with nothing marking it as a list item. Our own backend parser
 * (src/lib/job/normalize.ts) only splits a section's lines into separate
 * requirement items when they carry a literal bullet-marker character —
 * without one, "React"/"Next.js"/"TypeScript" on separate lines silently
 * collapse into one unmatched run-on string. Prefixing "- " here restores
 * the structural fact that these ARE separate bullets — the exact
 * information HTML's `<li>` already conveys, not invented content.
 */
export function extractTextWithLineBreaks(root: Element): string {
  function walk(node: Node): string {
    if (node.nodeType === node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (node.nodeType !== node.ELEMENT_NODE) {
      return "";
    }
    const element = node as Element;
    // Some sites (e.g. Indeed) embed scoped <style> blocks directly inside
    // the description container itself — walking into them would leak raw
    // CSS text into the extracted description. <script> is excluded for the
    // same reason, on general principle (never seen in practice, but never
    // meaningful text either).
    if (element.tagName === "STYLE" || element.tagName === "SCRIPT") {
      return "";
    }
    let text = "";
    for (const child of Array.from(element.childNodes)) {
      text += walk(child);
    }
    if (element.tagName === "LI") {
      const trimmed = text.trim();
      const marked = BULLET_PREFIX.test(trimmed) ? trimmed : `- ${trimmed}`;
      return `\n${marked}\n`;
    }
    return BLOCK_TAGS.has(element.tagName) ? `\n${text}\n` : text;
  }

  return walk(root)
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}
