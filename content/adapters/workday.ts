import { firstNonEmptyText, type ExtractedJobFields, type JobPageAdapter } from "./types";

export const workdayAdapter: JobPageAdapter = {
  source: "workday",

  canHandle(url) {
    return /myworkdayjobs\.com$/.test(new URL(url).hostname);
  },

  extractJob(doc, url): ExtractedJobFields | null {
    const description = firstNonEmptyText(doc, ['[data-automation-id="jobPostingDescription"]']);
    if (!description) return null;

    // Workday sites are hosted at <company>.myworkdayjobs.com.
    const companyFromHost = new URL(url).hostname.split(".")[0];

    return {
      title: firstNonEmptyText(doc, ['[data-automation-id="jobPostingHeader"]', "h1"]),
      company: companyFromHost || undefined,
      location: firstNonEmptyText(doc, ['[data-automation-id="locations"]']),
      description,
    };
  },
};
