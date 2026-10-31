import type { ExtensionMessage } from "../lib/messaging";
import { clearDetectedJobForTab, setDetectedJobForTab } from "../lib/storage";

// Ensure clicking the toolbar icon opens the side panel reliably
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.action?.onClicked?.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
});

function handleMessage(message: ExtensionMessage, tabId: number) {
  if (message.type === "JOB_DETECTED") {
    void setDetectedJobForTab(tabId, message.job);
  } else if (message.type === "JOB_DETECTION_FAILED") {
    void setDetectedJobForTab(tabId, { reason: message.reason });
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender) => {
  const tabId = sender.tab?.id;
  if (tabId !== undefined) {
    handleMessage(message, tabId);
    return;
  }

  // Fallback if sender.tab.id is missing (e.g. injected script via executeScript)
  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([activeTab]) => {
    if (activeTab?.id) {
      handleMessage(message, activeTab.id);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading" && changeInfo.url) {
    void clearDetectedJobForTab(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void clearDetectedJobForTab(tabId);
});
