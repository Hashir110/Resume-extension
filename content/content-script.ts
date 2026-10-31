import { selectSiteAdapter } from "./adapters";
import type { ExtensionMessage } from "../lib/messaging";

let lastReportedHash = "";

function detectAndReport(): void {
  try {
    const adapter = selectSiteAdapter(window.location.href);
    if (!adapter) return;

    const extracted = adapter.extractJob(document, window.location.href);
    const hash = extracted ? `${extracted.title}|${extracted.company}|${extracted.description.slice(0, 100)}` : "";

    if (hash && hash === lastReportedHash) {
      return; // Already reported this exact job state
    }
    lastReportedHash = hash;

    const message: ExtensionMessage = extracted
      ? {
          type: "JOB_DETECTED",
          tabId: -1,
          job: { ...extracted, source: adapter.source, sourceUrl: window.location.href },
        }
      : {
          type: "JOB_DETECTION_FAILED",
          tabId: -1,
          reason: "This page's layout did not match the expected job posting structure.",
        };

    chrome.runtime.sendMessage(message).catch(() => {});
  } catch (error) {
    const message: ExtensionMessage = {
      type: "JOB_DETECTION_FAILED",
      tabId: -1,
      reason: error instanceof Error ? error.message : "Unknown extraction error.",
    };
    chrome.runtime.sendMessage(message).catch(() => {});
  }
}

// Initial detection on script run
detectAndReport();

// Retry after short delay for SPAs where job details load asynchronously
setTimeout(detectAndReport, 1000);
setTimeout(detectAndReport, 2500);

// Observe DOM mutations for dynamic SPA navigation (e.g. clicking different jobs in a search list)
let timer: ReturnType<typeof setTimeout> | null = null;
const observer = new MutationObserver(() => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(detectAndReport, 800);
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
