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
          className="h-48 overflow-y-auto bg-surface-raised"
          style={{
            border: "1px solid var(--color-border)",
            clipPath:
              "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
          }}
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
                className="w-full py-3 text-center transition-all"
                style={
                  currentMinutes === minutes
                    ? {
                        background: "var(--color-accent)",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "1.25rem",
                        boxShadow: "0 0 12px var(--color-accent-60)",
                      }
                    : {
                        color: "var(--color-text)",
                      }
                }
                onMouseEnter={(e) => {
                  if (currentMinutes !== minutes)
                    e.currentTarget.style.background =
                      "var(--color-surface-raised)";
                }}
                onMouseLeave={(e) => {
                  if (currentMinutes !== minutes)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                {minutes} min{minutes !== 1 ? "s" : ""} ago
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onClose()}
            className="flex-1 py-2.5 font-bold uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98]"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-muted)",
              clipPath:
                "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
              fontFamily: "monospace",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onClose(currentMinutes * 60)}
            className="flex-1 py-2.5 font-bold uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98]"
            style={{
              background: "var(--color-accent)",
              color: "#000",
              border: "1px solid var(--color-accent-80)",
              clipPath:
                "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
              fontFamily: "monospace",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
