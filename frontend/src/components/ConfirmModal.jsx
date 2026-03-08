const chamfer = (s = 8) =>
  `polygon(${s}px 0%, 100% 0%, 100% calc(100% - ${s}px), calc(100% - ${s}px) 100%, 0% 100%, 0% ${s}px)`;

export default function ConfirmModal({
  isOpen, onClose, onConfirm, title, message, subMessage,
  cancelText = "Cancel", confirmText = "Confirm", confirmDanger = false, children,
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[999] px-4 fade-in"
      style={{ background: "rgba(0,0,0,0.88)" }}
    >
      <div
        className="w-full max-w-sm p-6 modal-slide-up"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border-bright)",
          clipPath: chamfer(10),
          boxShadow: "0 0 48px rgba(0,0,0,0.95), 0 0 24px var(--color-accent-15)",
        }}
      >
        <h2
          className="text-sm font-bold uppercase tracking-[0.2em] mb-3"
          style={{ color: "var(--color-text)", fontFamily: "monospace" }}
        >
          {title}
        </h2>
        {children ? children : (
          <>
            <p className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>{message}</p>
            {subMessage && (
              <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>{subMessage}</p>
            )}
          </>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-muted)",
              clipPath: chamfer(6),
              fontFamily: "monospace",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-bold uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
            style={
              confirmDanger
                ? {
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid var(--color-danger)",
                    color: "var(--color-danger)",
                    clipPath: chamfer(6),
                    fontFamily: "monospace",
                  }
                : {
                    background: "var(--color-accent)",
                    border: "1px solid var(--color-accent-80)",
                    color: "#000",
                    clipPath: chamfer(6),
                    fontFamily: "monospace",
                  }
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}