import { firstNonEmptyText, type ExtractedJobFields, type JobPageAdapter } from "./types";

export const greenhouseAdapter: JobPageAdapter = {
  source: "greenhouse",

  canHandle(url) {
    return /(^|\.)greenhouse\.io$/.test(new URL(url).hostname);
  },

  extractJob(doc): ExtractedJobFields | null {
    const description = firstNonEmptyText(doc, [
      "#content",
      ".job__description",
      "#app_body",
    ]);
    if (!description) return null;

    return {
      title: firstNonEmptyText(doc, [".app-title", "h1"]),
      company: firstNonEmptyText(doc, [".company-name", "#header .company-name"]),
      location: firstNonEmptyText(doc, [".location"]),
      description,
    };
  },
};
