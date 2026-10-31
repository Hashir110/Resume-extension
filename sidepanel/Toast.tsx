interface ToastProps {
  message: string;
  onDismiss: () => void;
}

/** Small floating toast for the side panel — shows the real backend/error message as-is. */
export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        right: 12,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
        background: "#b91c1c",
        color: "#fff",
        borderRadius: 6,
        padding: "10px 12px",
        fontSize: 13,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 1000,
      }}
    >
      <span style={{ whiteSpace: "pre-wrap" }}>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          opacity: 0.85,
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
