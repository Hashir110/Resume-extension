import { genericAdapter } from "./adapters/generic";
import type { ExtensionMessage } from "../lib/messaging";

/**
 * Bundled as its own entry (generic-detect.js) and injected on demand via
 * chrome.scripting.executeScript when the user explicitly asks the side
 * panel to try detecting an unrecognized page — never auto-injected, so it
 * needs no host_permissions of its own (activeTab covers the one-off run).
 */
function run(): void {
  try {
    const extracted = genericAdapter.extractJob(document, window.location.href);
    const message: ExtensionMessage = extracted
      ? {
          type: "JOB_DETECTED",
          tabId: -1,
          job: { ...extracted, source: "generic-webpage", sourceUrl: window.location.href },
        }
      : {
          type: "JOB_DETECTION_FAILED",
          tabId: -1,
          reason: "Could not find enough job-like content on this page.",
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

run();
