import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
        document.body.style.overflow = "";
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible) return null;

  return createPortal(
    <div
      className={`fixed inset-0 flex items-end justify-center z-[999] ${
        closing ? "fade-out" : "fade-in"
      }`}
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg ${
          closing ? "modal-slide-down" : "modal-slide-up"
        }`}
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border-bright)",
          borderLeft: "1px solid var(--color-border)",
          borderRight: "1px solid var(--color-border)",
          clipPath:
            "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% 100%, 0% 100%, 0% 12px)",
          boxShadow:
            "0 -8px 48px rgba(0,0,0,0.95), 0 -1px 0 var(--color-accent-20)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            className="px-6 pt-6 pb-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h3
              className="text-sm font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--color-text)", fontFamily: "monospace" }}
            >
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="transition-colors"
                style={{ color: "var(--color-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-accent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-muted)")
                }
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        {children}
        <div className="h-8" />
      </div>
    </div>,
    document.body
  );
}
