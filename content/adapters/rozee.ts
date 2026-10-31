import type { ExtractedJobFields, JobPageAdapter } from "./types";
import { firstNonEmptyText } from "./types";
import { extractTextWithLineBreaks } from "./text-extraction";

export const rozeeAdapter: JobPageAdapter = {
  source: "generic-webpage",

  canHandle(url: string) {
    return /(^|\.)rozee\.pk$/.test(new URL(url).hostname);
  },

  extractJob(doc: Document): ExtractedJobFields | null {
    const title = firstNonEmptyText(doc, [
      "h1.jtitle",
      "h1.job-title",
      ".jhead h1",
      "h1",
    ]);

    const company = firstNonEmptyText(doc, [
      ".cname",
      ".company-name",
      ".jcompany",
      "a.cname",
    ]);

    const location = firstNonEmptyText(doc, [
      ".jlocation",
      ".job-location",
      ".loc",
    ]);

    const descContainer =
      // Current rozee.pk markup (checked against a live job page): the
      // description lives in the "Job Detail" tab pane, `#jbDetail` — a
      // stable id, unlike `.jblk`, which rozee reuses on ~5 unrelated chips
      // (title/company/location badges) on the same page. The older
      // selectors below are kept as fallbacks in case rozee serves a
      // different template elsewhere; `main` never existed on this page at
      // all, which is why detection silently failed (descContainer was
      // always null here, not just picking the wrong element).
      doc.querySelector("#jbDetail") ??
      doc.querySelector("#job-description") ??
      doc.querySelector(".jdesc") ??
      doc.querySelector(".job-desc") ??
      doc.querySelector(".job-detail") ??
      doc.querySelector("main");

    const description = descContainer ? extractTextWithLineBreaks(descContainer) : "";
    if (description.length < 30) return null;

    return {
      title: title ?? undefined,
      company: company ?? undefined,
      location: location ?? undefined,
      description,
    };
  },
};
