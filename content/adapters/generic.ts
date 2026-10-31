import { extractTextWithLineBreaks } from "./text-extraction";
import type { ExtractedJobFields, JobPageAdapter } from "./types";

const MAX_DESCRIPTION_LENGTH = 20_000;
const NOISE_SELECTORS = [
  "nav",
  "header",
  "footer",
  "script",
  "style",
  "noscript",
  "[role='navigation']",
  "[aria-label*='comment' i]",
  "[class*='comment' i]",
  "[class*='sidebar' i]",
  "[class*='recommend' i]",
];

function extractMainText(doc: Document): string {
  const clone = doc.cloneNode(true) as Document;
  for (const selector of NOISE_SELECTORS) {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  }
  const container =
    clone.querySelector("main") ?? clone.querySelector("article") ?? clone.body;
  return container ? extractTextWithLineBreaks(container) : "";
}

/**
 * Fallback for pages with no dedicated adapter. Heuristic only — this is
 * never auto-injected (see manifest.json); it only runs when the user
 * explicitly asks the side panel to "detect this page" via
 * chrome.scripting.executeScript under the activeTab permission.
 */
export const genericAdapter: JobPageAdapter = {
  source: "generic-webpage",

  canHandle() {
    return true;
  },

  extractJob(doc): ExtractedJobFields | null {
    const description = extractMainText(doc).slice(0, MAX_DESCRIPTION_LENGTH);
    if (description.length < 40) return null;

    const title =
      doc.querySelector("h1")?.textContent?.trim() || doc.title.trim() || undefined;
    const company =
      doc
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute("content")
        ?.trim() || undefined;

    return { title, company, description };
  },
};
