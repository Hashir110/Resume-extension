import { firstNonEmptyText, type ExtractedJobFields, type JobPageAdapter } from "./types";

export const linkedInAdapter: JobPageAdapter = {
  source: "linkedin",

  canHandle(url) {
    return /(^|\.)linkedin\.com$/.test(new URL(url).hostname);
  },

  extractJob(doc): ExtractedJobFields | null {
    const description = firstNonEmptyText(doc, [
      ".jobs-description__content",
      ".jobs-box__html-content",
      ".description__text",
    ]);
    if (!description) return null;

    return {
      title: firstNonEmptyText(doc, ["h1.top-card-layout__title", "h1"]),
      company: firstNonEmptyText(doc, [
        ".topcard__org-name-link",
        ".top-card-layout__second-subline a",
      ]),
      location: firstNonEmptyText(doc, [".topcard__flavor--bullet"]),
      description,
    };
  },
};
