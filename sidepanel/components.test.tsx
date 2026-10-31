import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthSection, JobSection, TailoringSection } from "./components";
import type { JobState, TailoringState } from "./state";

afterEach(cleanup);

const noop = () => {};
const fallbackProps = {
  showManualFallback: false,
  manualDescription: "",
  onToggleManualFallback: noop,
  onManualDescriptionChange: noop,
  onSubmitManual: noop,
  onDetectGeneric: noop,
};

describe("AuthSection", () => {
  it("shows a sign-in prompt when signed out", () => {
    render(
      <AuthSection authState={{ kind: "signed-out" }} onSignIn={noop} onConnect={async () => {}} onLogout={noop} />,
    );
    expect(screen.getByText("Sign in to Resume Tailor")).toBeTruthy();
  });

  it("shows the expired-session message when the token expired", () => {
    render(
      <AuthSection authState={{ kind: "expired" }} onSignIn={noop} onConnect={async () => {}} onLogout={noop} />,
    );
    expect(screen.getByText("Your session expired. Sign in again.")).toBeTruthy();
  });

  it("shows the signed-in user's email and a sign-out action", () => {
    const onLogout = vi.fn();
    render(
      <AuthSection
        authState={{ kind: "signed-in", email: "jane@example.com" }}
        onSignIn={noop}
        onConnect={async () => {}}
        onLogout={onLogout}
      />,
    );
    expect(screen.getByText("jane@example.com")).toBeTruthy();
    fireEvent.click(screen.getByText("Sign out"));
    expect(onLogout).toHaveBeenCalled();
  });

  it("submits the pasted code via onConnect", async () => {
    const onConnect = vi.fn(async () => {});
    render(
      <AuthSection authState={{ kind: "signed-out" }} onSignIn={noop} onConnect={onConnect} onLogout={noop} />,
    );

    fireEvent.change(screen.getByLabelText("Connection code"), { target: { value: "abc123" } });
    fireEvent.click(screen.getByText("Connect"));

    await vi.waitFor(() => expect(onConnect).toHaveBeenCalledWith("abc123"));
  });

  it("shows an error message when onConnect rejects", async () => {
    const onConnect = vi.fn(async () => {
      throw new Error("Invalid or expired code.");
    });
    render(
      <AuthSection authState={{ kind: "signed-out" }} onSignIn={noop} onConnect={onConnect} onLogout={noop} />,
    );

    fireEvent.change(screen.getByLabelText("Connection code"), { target: { value: "bad" } });
    fireEvent.click(screen.getByText("Connect"));

    await vi.waitFor(() => expect(screen.getByText("Invalid or expired code.")).toBeTruthy());
  });
});

describe("JobSection", () => {
  it("shows the unsupported-site message when no job is detected", () => {
    render(<JobSection jobState={{ kind: "unsupported-site" }} {...fallbackProps} />);
    expect(screen.getByText(/not recognized as a supported job page/i)).toBeTruthy();
  });

  it("shows job details once a job is detected", () => {
    const jobState: JobState = {
      kind: "detected",
      job: {
        source: "linkedin",
        sourceUrl: "https://x",
        title: "Senior Frontend Engineer",
        company: "Acme Corp",
        description: "y",
      },
    };
    render(<JobSection jobState={jobState} {...fallbackProps} />);
    expect(screen.getByText(/job detected/i)).toBeTruthy();
    expect(screen.getByText("Senior Frontend Engineer")).toBeTruthy();
    expect(screen.getByText("Acme Corp")).toBeTruthy();
  });

  it("flags an incomplete detection when title or company is missing", () => {
    const jobState: JobState = {
      kind: "detected",
      job: { source: "generic-webpage", sourceUrl: "https://x", description: "y" },
    };
    render(<JobSection jobState={jobState} {...fallbackProps} />);
    expect(screen.getByText(/some job details could not be detected/i)).toBeTruthy();
  });

  it("shows the reason when detection failed", () => {
    render(
      <JobSection
        jobState={{ kind: "failed", reason: "layout changed" }}
        {...fallbackProps}
      />,
    );
    expect(screen.getByText(/layout changed/)).toBeTruthy();
  });
});

describe("TailoringSection", () => {
  it("renders nothing while idle", () => {
    const { container } = render(
      <TailoringSection tailoring={{ kind: "idle" }} onReview={noop} />,
    );
    expect(container.textContent).toBe("");
  });

  it("shows staged loading copy", () => {
    const states: TailoringState[] = [
      { kind: "analyzing" },
      { kind: "matching" },
      { kind: "preparing" },
    ];
    for (const tailoring of states) {
      const { unmount } = render(<TailoringSection tailoring={tailoring} onReview={noop} />);
      unmount();
    }
    render(<TailoringSection tailoring={{ kind: "matching" }} onReview={noop} />);
    expect(screen.getByText(/matching your experience/i)).toBeTruthy();
  });

  it("shows a success summary with a Review Changes action", () => {
    const onReview = vi.fn();
    render(
      <TailoringSection
        tailoring={{
          kind: "success",
          plan: {
            id: "plan-1",
            resumeId: "r",
            resumeVersion: 1,
            jobId: "j",
            jobAnalysisId: "a",
            resumeJobMatchId: "m",
            provider: "openai",
            model: "gpt-4o-mini",
            promptVersion: "tailoring-v1",
            changes: [{}, {}, {}] as never,
            integrityWarnings: [],
            createdAt: new Date().toISOString(),
          },
          usage: { plan: "FREE", limit: 5, currentUsage: 2 },
        }}
        onReview={onReview}
      />,
    );
    expect(screen.getByText("3 suggested changes")).toBeTruthy();
    expect(screen.getByText(/2 \/ 5 tailorings used/)).toBeTruthy();
    screen.getByText("Review Changes").click();
    expect(onReview).toHaveBeenCalledWith("plan-1");
  });

  it("shows the limit-reached state with usage numbers and an upgrade action", () => {
    const onUpgrade = vi.fn();
    render(
      <TailoringSection
        tailoring={{ kind: "limit-reached", usage: { plan: "FREE", limit: 5, currentUsage: 5 } }}
        onReview={noop}
        onUpgrade={onUpgrade}
      />,
    );
    expect(screen.getByText(/monthly tailoring limit has been reached/i)).toBeTruthy();
    expect(screen.getByText(/5 \/ 5 tailorings used/)).toBeTruthy();
    screen.getByText("Upgrade to Pro").click();
    expect(onUpgrade).toHaveBeenCalled();
  });

  it("shows an error message on failure", () => {
    render(
      <TailoringSection tailoring={{ kind: "error", message: "Tailoring failed. Try again." }} onReview={noop} />,
    );
    expect(screen.getByText("Tailoring failed. Try again.")).toBeTruthy();
  });
});
