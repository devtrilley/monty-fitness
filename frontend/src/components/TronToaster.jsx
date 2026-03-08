import { Toaster, toast as hotToast } from "react-hot-toast";

const chamfer =
  "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)";

function TronToast({ t }) {
  const isError = t.type === "error";
  const isSuccess = t.type === "success";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "var(--color-surface)",
        border: `1px solid ${
          isError
            ? "var(--color-danger)"
            : isSuccess
            ? "var(--color-accent-60)"
            : "var(--color-border-bright)"
        }`,
        color: "var(--color-text)",
        padding: "10px 16px",
        fontFamily: "monospace",
        fontSize: "12px",
        letterSpacing: "0.08em",
        clipPath: chamfer,
        boxShadow: isError
          ? "0 0 16px rgba(239,68,68,0.25), 0 4px 24px rgba(0,0,0,0.8)"
          : "0 0 16px var(--color-accent-20), 0 4px 24px rgba(0,0,0,0.8)",
        opacity: t.visible ? 1 : 0,
        transform: t.visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 200ms ease, transform 200ms ease",
        maxWidth: "320px",
        pointerEvents: "auto",
      }}
    >
      <span
        style={{
          color: isError
            ? "var(--color-danger)"
            : isSuccess
            ? "var(--color-accent)"
            : "var(--color-muted)",
          fontSize: "14px",
          flexShrink: 0,
        }}
      >
        {isError ? "✕" : isSuccess ? "✓" : "ℹ"}
      </span>
      <span>{typeof t.message === "function" ? t.message(t) : t.message}</span>
    </div>
  );
}

export default function TronToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={8}
      containerStyle={{ top: 64 }}
      toastOptions={{ duration: 2500 }}
    >
      {(t) => <TronToast t={t} />}
    </Toaster>
  );
}

export { hotToast as toast };
