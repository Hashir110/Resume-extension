import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/api-client", () => ({
  apiClient: {
    auth: { exchangeCode: vi.fn(), logout: vi.fn() },
    resumes: { list: vi.fn() },
    jobs: { create: vi.fn(), tailor: vi.fn() },
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status = 0) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("../lib/storage", () => ({
  getApiBaseUrl: vi.fn(async () => "http://localhost:3000"),
  getAuthState: vi.fn(async () => ({
    token: "test-token",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "user-1", email: "jane@example.com" },
  })),
  getDetectedJobForTab: vi.fn(async () => undefined),
  getSelectedResumeId: vi.fn(async () => "stale-resume-id"),
  setSelectedResumeId: vi.fn(async () => {}),
  isFailedDetection: () => false,
}));

vi.mock("../content/adapters", () => ({
  selectSiteAdapter: () => null,
}));

import { apiClient } from "../lib/api-client";
import { setSelectedResumeId } from "../lib/storage";
import { App } from "./App";

afterEach(cleanup);

describe("App resume selection", () => {
  it("clears a remembered resume id that no longer exists in the fetched list, instead of silently keeping it selected", async () => {
    vi.mocked(apiClient.resumes.list).mockResolvedValue([
      { id: "real-resume-id", name: "Real Resume", templateId: "professional-classic", updatedAt: "" },
    ]);

    await act(async () => {
      render(<App />);
    });
    // Flush the auth bootstrap effect, then the init() effect (chrome.tabs.query
    // + storage reads), then the resumes-list effect it triggers.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const select = screen.getByLabelText(/master resume/i) as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(setSelectedResumeId).toHaveBeenCalledWith("");
  });

  it("keeps a remembered resume id selected when it's still present in the fetched list", async () => {
    vi.mocked(apiClient.resumes.list).mockResolvedValue([
      { id: "stale-resume-id", name: "Still Here", templateId: "professional-classic", updatedAt: "" },
    ]);
    vi.mocked(setSelectedResumeId).mockClear();

    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const select = screen.getByLabelText(/master resume/i) as HTMLSelectElement;
    expect(select.value).toBe("stale-resume-id");
    expect(setSelectedResumeId).not.toHaveBeenCalled();
  });
});
