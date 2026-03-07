import BaseModal from "./BaseModal";

export default function TimeEditModal({
  isOpen,
  onClose,
  currentMinutes,
  onSelectMinutes,
  hasScrolled,
  setHasScrolled,
}) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Adjust Duration">
      <div className="px-6">
        <p className="text-sm text-muted mb-4">How long ago did you start?</p>

        <div
          className="h-48 overflow-y-auto border border-border rounded-lg bg-surface-raised"
          ref={(el) => {
            if (el && isOpen && !hasScrolled) {
              const itemHeight = 48;
              el.scrollTop = Math.max(
                0,
                currentMinutes * itemHeight -
                  el.offsetHeight / 2 +
                  itemHeight / 2
              );
              setHasScrolled(true);
            }
          }}
        >
          <div className="py-2">
            {Array.from({ length: 181 }, (_, i) => i).map((minutes) => (
              <button
                key={minutes}
                onClick={() => onSelectMinutes(minutes)}
                className={`w-full py-3 text-center transition-colors ${
                  currentMinutes === minutes
                    ? "bg-accent text-white font-bold text-xl"
                    : "text-text hover:bg-border"
                }`}
              >
                {minutes} min{minutes !== 1 ? "s" : ""} ago
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onClose()}
            className="flex-1 py-2.5 rounded-lg border border-border text-muted hover:bg-surface-raised transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onClose(currentMinutes * 60)}
            className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
