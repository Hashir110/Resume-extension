import { firstNonEmptyText, type ExtractedJobFields, type JobPageAdapter } from "./types";

export const leverAdapter: JobPageAdapter = {
  source: "lever",

  canHandle(url) {
    return /(^|\.)lever\.co$/.test(new URL(url).hostname);
  },

  extractJob(doc, url): ExtractedJobFields | null {
    const description = firstNonEmptyText(doc, [
      ".posting-page .section-wrapper",
      '[data-qa="job-description"]',
      ".posting-description",
    ]);
    if (!description) return null;

    // Lever posting pages rarely show the company name on-page (the site is
    // hosted at jobs.lever.co/<company>/...); fall back to the URL path.
    const companyFromPath = new URL(url).pathname.split("/").filter(Boolean)[0];

    return {
      title: firstNonEmptyText(doc, [".posting-headline h2", "h2"]),
      company: firstNonEmptyText(doc, [".main-header-text .company-name"]) ?? companyFromPath,
      location: firstNonEmptyText(doc, [".posting-categories .location"]),
      description,
    };
  },
};
