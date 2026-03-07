export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  subMessage,
  cancelText = "Cancel",
  confirmText = "Confirm",
  confirmDanger = false,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] px-4">
      <div className="bg-surface border border-border rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-text mb-2">{title}</h2>
        {children ? (
          children
        ) : (
          <>
            <p className="text-sm text-muted mb-4">{message}</p>
            {subMessage && (
              <p className="text-sm text-muted mb-6">{subMessage}</p>
            )}
          </>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-muted hover:bg-surface-raised transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg text-white font-medium transition-colors ${
              confirmDanger
                ? "bg-danger hover:bg-red-700"
                : "bg-accent hover:bg-accent-hover"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
