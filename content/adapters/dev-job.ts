import type { ExtractedJobFields, JobPageAdapter } from "./types";
import { firstNonEmptyText } from "./types";

export const devJobAdapter: JobPageAdapter = {
  source: "generic-webpage",

  canHandle(url: string) {
    return url.includes("/dev-job") || url.includes("localhost:3000");
  },

  extractJob(doc: Document): ExtractedJobFields | null {
    const title = firstNonEmptyText(doc, ["h1"]);
    const company = firstNonEmptyText(doc, ["main header div", "header div"]);
    const description = doc.querySelector("main")?.textContent?.trim();

    if (!description) return null;

    return {
      title: title ?? "Senior Frontend Engineer",
      company: company ?? "Acme Technologies",
      description,
    };
  },
};
