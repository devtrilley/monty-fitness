import { Toaster, toast as hotToast } from "react-hot-toast";

function TronToast({ t }) {
  const isError = t.type === "error";
  const isSuccess = t.type === "success";

  const accentColor = isError ? "#ef4444" : isSuccess ? "#22c55e" : "#00c8ff";

  return (
    <div
      onClick={() => hotToast.dismiss(t.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "#0a0a0a",
        border: `2px solid ${accentColor}`,
        color: "#e8f4f8",
        padding: "10px 16px",
        fontFamily: "monospace",
        fontSize: "12px",
        cursor: "pointer",
        fontWeight: 500,
        letterSpacing: "0.05em",
        borderRadius: "4px",
        boxShadow: `
          0 0 20px ${accentColor}60,
          0 0 40px ${accentColor}30,
          inset 0 0 20px ${accentColor}10,
          0 8px 32px rgba(0,0,0,0.8)
        `,
        animation: t.visible
          ? "toastSlideIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
          : "toastSlideOut 200ms ease-in forwards",
        maxWidth: "340px",
        pointerEvents: "auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Border trace beam */}
      <svg
        style={{
          position: "absolute",
          top: "-2px",
          left: "-2px",
          width: "calc(100% + 4px)",
          height: "calc(100% + 4px)",
          pointerEvents: "none",
        }}
      >
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="4"
          ry="4"
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          style={{
            filter: `drop-shadow(0 0 8px ${accentColor})`,
            strokeDasharray: "60 500",
            strokeDashoffset: "0",
            animation: t.visible ? "borderTrace 2s linear infinite" : "none",
          }}
        />
      </svg>

      {/* Icon */}
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "4px",
          background: `${accentColor}20`,
          border: `1px solid ${accentColor}60`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 12px ${accentColor}40`,
        }}
      >
        <span style={{ color: accentColor, fontSize: "12px", fontWeight: 700 }}>
          {isError ? "✕" : isSuccess ? "✓" : "i"}
        </span>
      </div>

      {/* Message */}
      <span
        style={{
          textShadow: `0 0 10px ${accentColor}40`,
          lineHeight: 1.3,
        }}
      >
        {typeof t.message === "function" ? t.message(t) : t.message}
      </span>

      <style>{`
        @keyframes toastSlideIn {
          0% { opacity: 0; transform: translateY(-30px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastSlideOut {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-20px) scale(0.95); }
        }
        @keyframes borderTrace {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -560; }
        }
      `}</style>
    </div>
  );
}

export default function TronToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={12}
      containerStyle={{ top: 24 }}
      toastOptions={{ duration: 3000 }}
    >
      {(t) => <TronToast t={t} />}
    </Toaster>
  );
}

export { hotToast as toast };
