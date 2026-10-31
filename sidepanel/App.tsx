import { useEffect, useRef, useState } from "react";
import { selectSiteAdapter } from "../content/adapters";
import { apiClient, ApiError, type ResumeSummary } from "../lib/api-client";
import {
  getApiBaseUrl,
  getAuthState,
  getDetectedJobForTab,
  getSelectedResumeId,
  isFailedDetection,
  setSelectedResumeId,
} from "../lib/storage";
import { AuthSection, CoverLetterSection, JobSection, TailoringSection } from "./components";
import {
  type AuthState,
  computeCanTailor,
  toJobIngestionInput,
  type JobState,
  type TailoringState,
} from "./state";
import { Toast } from "./Toast";

const TOAST_AUTO_DISMISS_MS = 6000;

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function App() {
  const [webAppBaseUrl, setWebAppBaseUrl] = useState(__EXTENSION_API_BASE_URL__);
  const [authState, setAuthState] = useState<AuthState>({ kind: "loading" });
  const [tabId, setTabId] = useState<number | null>(null);
  const [jobState, setJobState] = useState<JobState>({ kind: "loading" });
  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [resumesError, setResumesError] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeIdState] = useState<string>("");
  const [tailoring, setTailoring] = useState<TailoringState>({ kind: "idle" });
  const [manualDescription, setManualDescription] = useState("");
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), TOAST_AUTO_DISMISS_MS);
  }

  async function refreshJobState(activeTabId: number, activeTabUrl: string | undefined) {
    const entry = await getDetectedJobForTab(activeTabId);
    if (entry) {
      setJobState(
        isFailedDetection(entry)
          ? { kind: "failed", reason: entry.reason }
          : { kind: "detected", job: entry },
      );
      return;
    }
    const supported = activeTabUrl ? selectSiteAdapter(activeTabUrl) : null;
    setJobState(supported ? { kind: "waiting" } : { kind: "unsupported-site" });
  }

  useEffect(() => {
    let cancelled = false;
    async function bootstrapAuth() {
      const base = await getApiBaseUrl();
      if (!cancelled) setWebAppBaseUrl(base);

      const stored = await getAuthState();
      if (cancelled) return;
      if (!stored) {
        setAuthState({ kind: "signed-out" });
      } else if (isExpired(stored.expiresAt)) {
        setAuthState({ kind: "expired" });
      } else {
        setAuthState({ kind: "signed-in", email: stored.user.email });
      }
    }
    void bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab) {
        [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      }
      if (cancelled || !tab?.id) return;
      setTabId(tab.id);
      await refreshJobState(tab.id, tab.url);

      const savedResumeId = await getSelectedResumeId();
      if (savedResumeId && !cancelled) setSelectedResumeIdState(savedResumeId);
    }

    void init();

    function onActivated(activeInfo: { tabId: number; windowId: number }) {
      if (cancelled) return;
      setTabId(activeInfo.tabId);
      void chrome.tabs.get(activeInfo.tabId).then((tab) => {
        if (!cancelled) void refreshJobState(tab.id!, tab.url);
      });
    }

    chrome.tabs.onActivated.addListener(onActivated);

    return () => {
      cancelled = true;
      chrome.tabs.onActivated.removeListener(onActivated);
    };
  }, []);

  useEffect(() => {
    if (authState.kind !== "signed-in") return;
    let cancelled = false;

    async function loadResumes() {
      try {
        const list = await apiClient.resumes.list();
        if (cancelled) return;
        setResumes(list);
        const savedResumeId = await getSelectedResumeId();
        if (savedResumeId && !list.some((resume) => resume.id === savedResumeId)) {
          setSelectedResumeIdState("");
          await setSelectedResumeId("");
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          setAuthState({ kind: "expired" });
          return;
        }
        const message =
          error instanceof ApiError ? error.message : "Could not connect to Resume Tailor.";
        setResumesError(message);
        showToast(message);
      }
    }

    void loadResumes();
    return () => {
      cancelled = true;
    };
  }, [authState.kind]);

  useEffect(() => {
    if (tabId === null) return;
    const currentTabId = tabId;
    function onStorageChanged(changes: { [key: string]: chrome.storage.StorageChange }) {
      if (changes.detectedJobsByTab) {
        void chrome.tabs.get(currentTabId).then((tab) => refreshJobState(currentTabId, tab.url));
      }
    }
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  const canTailor = computeCanTailor(jobState, selectedResumeId, tailoring);

  async function detectGenericPage() {
    let targetTabId = tabId;
    if (!targetTabId) {
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      targetTabId = activeTab?.id ?? null;
    }
    if (!targetTabId) return;
    await chrome.scripting.executeScript({ target: { tabId: targetTabId }, files: ["generic-detect.js"] });
  }

  async function submitManualDescription() {
    if (!manualDescription.trim()) return;
    try {
      const job = await apiClient.jobs.create({ description: manualDescription.trim() });
      setJobState({
        kind: "detected",
        job: {
          source: "manual",
          sourceUrl: job.sourceUrl ?? "",
          description: job.rawDescription,
          title: job.title,
          company: job.company,
        },
      });
      setShowManualFallback(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthState({ kind: "expired" });
        return;
      }
      const message =
        error instanceof ApiError ? error.message : "Failed to submit job description.";
      setTailoring({ kind: "error", message });
      showToast(message);
    }
  }

  async function onSelectResume(resumeId: string) {
    setSelectedResumeIdState(resumeId);
    await setSelectedResumeId(resumeId);
  }

  async function tailorResume() {
    if (jobState.kind !== "detected" || !selectedResumeId) return;
    setTailoring({ kind: "analyzing" });
    try {
      const job = await apiClient.jobs.create(toJobIngestionInput(jobState.job));
      setCreatedJobId(job.id);
      setTailoring({ kind: "matching" });
      const preparingTimer = setTimeout(() => setTailoring({ kind: "preparing" }), 1200);
      const { plan, usage } = await apiClient.jobs.tailor(job.id, selectedResumeId);
      clearTimeout(preparingTimer);
      setTailoring({ kind: "success", plan, usage });

      // Automatically generate tailored cover letter in parallel
      if (!coverLetter) {
        apiClient.jobs.getCoverLetter(job.id)
          .then((res) => setCoverLetter(res.coverLetter))
          .catch(() => {});
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === "USAGE_LIMIT_REACHED" && error.details) {
        const usage = error.details as unknown as { plan: "FREE" | "PRO"; limit: number | null; currentUsage: number };
        setTailoring({ kind: "limit-reached", usage });
        showToast("Monthly tailoring limit reached.");
        return;
      }
      if (error instanceof ApiError && error.status === 401) {
        setAuthState({ kind: "expired" });
        return;
      }
      const message = error instanceof ApiError ? error.message : "Tailoring failed. Try again.";
      setTailoring({ kind: "error", message });
      showToast(message);
    }
  }

  async function generateCoverLetter() {
    if (jobState.kind !== "detected") return;
    setCoverLetterLoading(true);
    try {
      const job = await apiClient.jobs.create(toJobIngestionInput(jobState.job));
      setCreatedJobId(job.id);
      const res = await apiClient.jobs.getCoverLetter(job.id);
      setCoverLetter(res.coverLetter);
      showToast("✓ Tailored application note generated!");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthState({ kind: "expired" });
        return;
      }
      showToast("Failed to generate application note.");
    } finally {
      setCoverLetterLoading(false);
    }
  }

  function getEffectiveBaseUrl() {
    return __EXTENSION_API_BASE_URL__ && !__EXTENSION_API_BASE_URL__.includes("localhost")
      ? __EXTENSION_API_BASE_URL__
      : webAppBaseUrl;
  }

  function openCoverLetterWeb() {
    const base = getEffectiveBaseUrl();
    if (createdJobId) {
      void chrome.tabs.create({ url: `${base}/jobs/${createdJobId}/cover-letter` });
    } else {
      showToast("Please generate the proposal first.");
    }
  }

  function openReview(planId: string) {
    const base = getEffectiveBaseUrl();
    void chrome.tabs.create({ url: `${base}/tailoring/${planId}` });
  }

  function onSignIn() {
    const base = getEffectiveBaseUrl();
    void chrome.tabs.create({ url: `${base}/extension/authorize` });
  }

  async function onConnectCode(code: string) {
    const result = await apiClient.auth.exchangeCode(code);
    setAuthState({ kind: "signed-in", email: result.user.email });
  }

  async function onLogout() {
    await apiClient.auth.logout();
    setAuthState({ kind: "signed-out" });
  }

  return (
    <div className="sidepanel-container">
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}

      <header className="app-header">
        <div className="brand-badge">
          <div className="brand-icon">RT</div>
          <h1 className="brand-title">Resume Tailor</h1>
        </div>
        {authState.kind === "signed-in" && (
          <div className="user-status-pill">
            <span className="user-dot" />
            <span>Active</span>
          </div>
        )}
      </header>

      <AuthSection
        authState={authState}
        onSignIn={onSignIn}
        onConnect={onConnectCode}
        onLogout={() => void onLogout()}
      />

      {authState.kind === "signed-in" && (
        <>
          <JobSection
            jobState={jobState}
            showManualFallback={showManualFallback}
            manualDescription={manualDescription}
            onToggleManualFallback={() => setShowManualFallback((v) => !v)}
            onManualDescriptionChange={setManualDescription}
            onSubmitManual={() => void submitManualDescription()}
            onDetectGeneric={() => void detectGenericPage()}
          />

          <CoverLetterSection
            coverLetter={coverLetter}
            loading={coverLetterLoading}
            jobState={jobState}
            onGenerate={() => void generateCoverLetter()}
            onOpenWeb={openCoverLetterWeb}
          />

          <div className="panel-card animate-fade-in">
            <label htmlFor="resume-select" className="input-label">
              Target Master Resume
            </label>
            {resumesError && <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>{resumesError}</p>}
            {!resumesError && resumes === null && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="spinner" style={{ borderColor: "rgba(99, 102, 241, 0.2)", borderTopColor: "#4f46e5" }} />
                <span style={{ fontSize: 12, color: "#64748b" }}>Loading master resumes…</span>
              </div>
            )}
            {!resumesError && resumes?.length === 0 && (
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>
                  No master resumes found in your account.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => void chrome.tabs.create({ url: `${webAppBaseUrl}/resumes` })}
                >
                  📄 Upload Master Resume
                </button>
              </div>
            )}
            {resumes && resumes.length > 0 && (
              <select
                id="resume-select"
                className="form-select"
                value={selectedResumeId}
                onChange={(e) => void onSelectResume(e.target.value)}
              >
                <option value="" disabled>
                  Select master resume…
                </option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    📄 {resume.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={!canTailor}
            aria-disabled={!canTailor}
            title={
              canTailor
                ? undefined
                : jobState.kind !== "detected"
                ? "Detect a job on this page first."
                : "Select a master resume first."
            }
            onClick={() => void tailorResume()}
          >
            ✨ Tailor My Resume
          </button>

          <div aria-live="polite">
            <TailoringSection
              tailoring={tailoring}
              onReview={openReview}
              onUpgrade={() => showToast("Upgrade isn't available yet — contact support.")}
            />
          </div>
        </>
      )}
    </div>
  );
}
