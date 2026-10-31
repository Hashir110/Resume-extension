import { useState } from "react";
import type { AuthState, JobState, TailoringState } from "./state";

export function AuthSection(props: {
  authState: AuthState;
  onSignIn: () => void;
  onConnect: (code: string) => Promise<void>;
  onLogout: () => void;
}) {
  const [code, setCode] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authState } = props;

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      await props.onConnect(code.trim());
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect. Try a new code.");
    } finally {
      setConnecting(false);
    }
  }

  if (authState.kind === "loading") {
    return (
      <div className="panel-card" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="spinner" style={{ borderColor: "rgba(99, 102, 241, 0.2)", borderTopColor: "#4f46e5" }} />
        <span style={{ fontSize: 13, color: "#64748b" }}>Checking authentication…</span>
      </div>
    );
  }

  if (authState.kind === "signed-in") {
    return (
      <div
        className="panel-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="user-dot" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{authState.email}</span>
        </div>
        <button type="button" className="btn-secondary" onClick={props.onLogout} style={{ padding: "4px 10px", fontSize: 11 }}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="panel-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {authState.kind === "expired" && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Your session expired. Please sign in again.
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
          Welcome to Resume Tailor
        </h2>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
          Connect your account to tailor your resume automatically against any job posting.
        </p>
      </div>

      <button type="button" className="btn-primary" onClick={props.onSignIn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        Sign in via Web App
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>OR CODE</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>

      <form onSubmit={(e) => void handleConnect(e)} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          className="form-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste connection code"
          aria-label="Connection code"
          disabled={connecting}
        />
        <button
          type="submit"
          className="btn-secondary"
          disabled={connecting || !code.trim()}
          style={{ flexShrink: 0, whiteSpace: "nowrap" }}
        >
          {connecting ? "Connecting…" : "Connect"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "#ef4444", margin: 0, fontSize: 12, fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function JobSection(props: {
  jobState: JobState;
  showManualFallback: boolean;
  manualDescription: string;
  onToggleManualFallback: () => void;
  onManualDescriptionChange: (value: string) => void;
  onSubmitManual: () => void;
  onDetectGeneric: () => void;
}) {
  const { jobState } = props;

  if (jobState.kind === "loading") {
    return (
      <div className="panel-card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="spinner" style={{ borderColor: "rgba(99, 102, 241, 0.2)", borderTopColor: "#4f46e5" }} />
        <span style={{ fontSize: 13, color: "#64748b" }}>Scanning page for job details…</span>
      </div>
    );
  }

  if (jobState.kind === "detected") {
    const { job } = jobState;
    const incomplete = !job.title || !job.company;
    return (
      <div className="panel-card card-detected animate-fade-in">
        <div className="card-header-label badge-emerald">
          <span className="badge-pulse-dot" />
          <span>Job detected</span>
        </div>
        <h3 className="job-title">{job.title ?? "Untitled Role"}</h3>
        <p className="job-company">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
          </svg>
          {job.company ?? "Company not specified"}
        </p>
        {job.description && (
          <div className="job-description-scroll">
            <p className="job-description-preview">{job.description}</p>
          </div>
        )}
        {incomplete && (
          <p style={{ margin: "8px 0 0", color: "#d97706", fontSize: 12, fontWeight: 500 }}>
            ⚠️ Partial job info detected. Extra details will be parsed during tailoring.
          </p>
        )}
      </div>
    );
  }

  if (jobState.kind === "waiting") {
    return (
      <div className="panel-card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="spinner" style={{ borderColor: "rgba(99, 102, 241, 0.2)", borderTopColor: "#4f46e5" }} />
        <span style={{ fontSize: 13, color: "#64748b" }}>Detecting job posting…</span>
      </div>
    );
  }

  if (jobState.kind === "failed") {
    return (
      <div className="panel-card card-warning animate-fade-in">
        <div className="card-header-label" style={{ color: "#d97706" }}>
          ⚠️ Detection Limited
        </div>
        <p style={{ fontSize: 13, color: "#475569", margin: "0 0 8px" }}>
          {jobState.reason ?? "Could not automatically parse structure."}
        </p>
        <ManualFallback {...props} />
      </div>
    );
  }

  return (
    <div className="panel-card animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Supported Job Page</span>
      </div>
      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px", lineHeight: 1.4 }}>
        Open a job posting on LinkedIn, Indeed, Greenhouse, Lever, Workday or click below:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" className="btn-secondary" onClick={props.onDetectGeneric} style={{ width: "100%" }}>
          🔍 Detect Page Content
        </button>
        <ManualFallback {...props} />
      </div>
    </div>
  );
}

export function ManualFallback(props: {
  showManualFallback: boolean;
  manualDescription: string;
  onToggleManualFallback: () => void;
  onManualDescriptionChange: (value: string) => void;
  onSubmitManual: () => void;
}) {
  if (!props.showManualFallback) {
    return (
      <button
        type="button"
        className="btn-ghost"
        onClick={props.onToggleManualFallback}
        style={{ marginTop: 4, display: "inline-block" }}
      >
        Paste Job Description manually →
      </button>
    );
  }
  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        className="form-input"
        value={props.manualDescription}
        onChange={(e) => props.onManualDescriptionChange(e.target.value)}
        placeholder="Paste the full job description text here…"
        rows={5}
        style={{ resize: "vertical", fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn-primary" onClick={props.onSubmitManual} style={{ flex: 1 }}>
          Use This Description
        </button>
        <button type="button" className="btn-secondary" onClick={props.onToggleManualFallback}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function UsageLine(props: { usage: { plan: "FREE" | "PRO"; limit: number | null; currentUsage: number } }) {
  const { plan, limit, currentUsage } = props.usage;
  if (plan === "PRO" || limit === null) {
    return (
      <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
        ✨ Pro Plan · Unlimited Tailorings
      </span>
    );
  }
  const pct = Math.min(100, Math.round((currentUsage / limit) * 100));
  return (
    <div style={{ width: "100%", marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
        <span>Monthly usage</span>
        <span style={{ fontWeight: 600, color: "#334155" }}>
          {currentUsage} / {limit} used
        </span>
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%`, background: pct >= 100 ? "#ef4444" : "var(--brand-gradient)" }}
        />
      </div>
    </div>
  );
}

export function TailoringSection(props: {
  tailoring: TailoringState;
  onReview: (planId: string) => void;
  onUpgrade?: () => void;
}) {
  const { tailoring } = props;

  if (tailoring.kind === "idle") return null;

  if (
    tailoring.kind === "analyzing" ||
    tailoring.kind === "matching" ||
    tailoring.kind === "preparing"
  ) {
    const statusText =
      tailoring.kind === "analyzing"
        ? "Analyzing job requirements…"
        : tailoring.kind === "matching"
        ? "Matching your experience…"
        : "Generating tailored resume…";

    const progressPct =
      tailoring.kind === "analyzing" ? 33 : tailoring.kind === "matching" ? 66 : 90;

    return (
      <div className="panel-card animate-fade-in" style={{ background: "#f8fafc" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="spinner" style={{ borderColor: "rgba(99, 102, 241, 0.2)", borderTopColor: "#4f46e5" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{statusText}</span>
        </div>
        <div className="progress-bar-container" style={{ marginTop: 10 }}>
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    );
  }

  if (tailoring.kind === "error") {
    return (
      <div
        className="panel-card animate-fade-in"
        style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}
      >
        <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Tailoring Failed</p>
        <p style={{ margin: "4px 0 0", fontSize: 12 }}>{tailoring.message}</p>
      </div>
    );
  }

  if (tailoring.kind === "limit-reached") {
    return (
      <div className="panel-card animate-fade-in" style={{ background: "#fffbe6", borderColor: "#fef08a" }}>
        <p style={{ margin: 0, fontWeight: 700, color: "#b45309", fontSize: 14 }}>
          Monthly Limit Reached
        </p>
        <p style={{ margin: "4px 0 8px", fontSize: 12, color: "#78350f" }}>
          You have used all available tailoring generations for this month.
        </p>
        <UsageLine usage={tailoring.usage} />
        {props.onUpgrade && (
          <button type="button" className="btn-primary" onClick={props.onUpgrade} style={{ marginTop: 12 }}>
            Upgrade to Pro
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="panel-card animate-fade-in card-detected">
      <div className="card-header-label badge-emerald">
        <span>✓ Tailoring Complete</span>
      </div>
      <p style={{ margin: "4px 0 8px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
        {tailoring.plan.changes.length} Evidence-backed suggestions ready
      </p>
      <UsageLine usage={tailoring.usage} />
      <button
        type="button"
        className="btn-primary"
        onClick={() => props.onReview(tailoring.plan.id)}
        style={{ marginTop: 12 }}
      >
        Review & Apply Changes →
      </button>
    </div>
  );
}

export function CoverLetterSection(props: {
  coverLetter: string | null;
  loading: boolean;
  jobState: JobState;
  onGenerate: () => void;
  onOpenWeb: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editedText, setEditedText] = useState("");

  const textToDisplay = editedText || props.coverLetter || "";

  async function handleCopy() {
    if (!textToDisplay) return;
    await navigator.clipboard.writeText(textToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (props.jobState.kind !== "detected") return null;

  return (
    <div
      className="panel-card animate-fade-in"
      style={{
        marginTop: 14,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15 }}>✉️</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            Tailored Proposal / Note
          </span>
        </div>
        {props.coverLetter && (
          <span
            className="badge-emerald"
            style={{ fontSize: 11, padding: "2px 8px", fontWeight: 600 }}
          >
            ✓ Ready
          </span>
        )}
      </div>

      {!props.coverLetter ? (
        <div>
          <p
            style={{
              fontSize: 12,
              color: "#64748b",
              margin: "0 0 10px",
              lineHeight: 1.4,
            }}
          >
            Generate a personalized application message matching this job description's keywords.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              fontWeight: 600,
            }}
            disabled={props.loading}
            onClick={props.onGenerate}
          >
            {props.loading ? "✨ Generating Note..." : "✨ Generate Tailored Proposal"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            className="form-input"
            value={textToDisplay}
            onChange={(e) => setEditedText(e.target.value)}
            rows={7}
            style={{
              fontSize: 11.5,
              lineHeight: 1.45,
              fontFamily: "inherit",
              resize: "vertical",
              width: "100%",
              boxSizing: "border-box",
              background: "#ffffff",
              borderColor: "#cbd5e1",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          />

          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="btn-primary"
              style={{
                flex: 1,
                background: copied
                  ? "#10b981"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                fontWeight: 600,
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              onClick={handleCopy}
            >
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Proposal"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600 }}
              title="Open full view on web"
              onClick={props.onOpenWeb}
            >
              ↗ Full View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

