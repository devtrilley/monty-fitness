import { useEffect } from "react";

export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-[999]"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-lg rounded-t-2xl border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 pt-6 pb-3 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-muted hover:text-text transition-colors"
              >
                <svg
                  className="w-6 h-6"
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
    </div>
  );
}
