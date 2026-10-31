import type { JobSource } from "../../shared-types";
import { extractTextWithLineBreaks } from "./text-extraction";

export interface ExtractedJobFields {
  title?: string;
  company?: string;
  description: string;
  location?: string;
  employmentType?: string;
}

export interface JobPageAdapter {
  source: JobSource;
  canHandle(url: string): boolean;
  /**
   * Returns null when extraction fails entirely (e.g. page layout changed).
   * `url` is passed explicitly (rather than read from `doc.location`) so
   * adapters are trivial to unit test with synthetic HTML + any URL string.
   */
  extractJob(doc: Document, url: string): ExtractedJobFields | null;
}

export function firstNonEmptyText(
  doc: Document,
  selectors: string[],
): string | undefined {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (!element) continue;
    // Line-break-aware: a description container's bullets/paragraphs stay on
    // their own lines instead of being squashed together (see
    // text-extraction.ts). A no-op for simple single-line fields.
    const text = extractTextWithLineBreaks(element);
    if (text) return text;
  }
  return undefined;
}
