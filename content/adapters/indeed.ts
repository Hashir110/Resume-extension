import { firstNonEmptyText, type ExtractedJobFields, type JobPageAdapter } from "./types";

export const indeedAdapter: JobPageAdapter = {
  source: "indeed",

  canHandle(url) {
    return /(^|\.)indeed\.com$/.test(new URL(url).hostname);
  },

  extractJob(doc): ExtractedJobFields | null {
    const description = firstNonEmptyText(doc, [
      // Current Indeed markup (checked against a live job page/search-panel
      // view): the description lives in a `.simple-job-description-html`
      // container. The two selectors below are the older template's
      // container — kept as fallbacks since Indeed serves more than one
      // layout (a dedicated /viewjob page vs. the search-results side
      // panel), not because either is known to still exist on its own.
      ".simple-job-description-html",
      "#jobDescriptionText",
      ".jobsearch-jobDescriptionText",
    ]);
    if (!description) return null;

    return {
      // Checked against a live search-results-with-side-panel page (the
      // "vj-" prefixed testids are that layout's naming convention — a
      // generic bare "h1" fallback is deliberately NOT used here: the page
      // always has its own unrelated SEO heading ("full stack developer
      // jobs in Karachi"), which a bare h1 fallback would silently match
      // instead of leaving the title undefined.
      title: firstNonEmptyText(doc, [
        '[data-testid="vj-job-title"]',
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        "h1.jobsearch-JobInfoHeader-title",
      ]),
      company: firstNonEmptyText(doc, [
        // The search-results side-panel layout.
        '[data-testid="company-name"]',
        // The dedicated /viewjob page's current layout — the name is the
        // link inside this metadata block, not the block's own direct text.
        '[data-testid="company-info-metadata"] a',
        '[data-testid="inlineHeader-companyName"]',
        '[data-testid="jobsearch-CompanyInfoContainer"] a',
        ".jobsearch-InlineCompanyRating div",
      ]),
      location: firstNonEmptyText(doc, [
        '[data-testid="inlineHeader-companyLocation"]',
        '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
      ]),
      description,
    };
  },
};
