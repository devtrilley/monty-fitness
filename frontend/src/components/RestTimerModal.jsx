import BaseModal from "./BaseModal";

const formatRestTime = (seconds) => {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs}s`;
};

export default function RestTimerModal({
  isOpen,
  onClose,
  exerciseName,
  currentRest,
  onSelectRest,
  hasScrolled,
  setHasScrolled,
}) {
  const options = [
    15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240,
    255, 270, 285, 300,
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Rest Timer">
      <p className="px-6 text-sm text-muted mb-4">{exerciseName}</p>

      <div
        className="px-6 space-y-2 mb-6 max-h-64 overflow-y-auto"
        ref={(el) => {
          if (el && isOpen && !hasScrolled) {
            const selectedIndex = options.indexOf(currentRest);
            if (selectedIndex !== -1) {
              const buttonHeight = 52;
              el.scrollTop = Math.max(
                0,
                selectedIndex * buttonHeight -
                  el.offsetHeight / 2 +
                  buttonHeight / 2
              );
              setHasScrolled(true);
            }
          }
        }}
      >
        {options.map((seconds) => (
          <button
            key={seconds}
            onClick={() => {
              onSelectRest(seconds);
              onClose();
            }}
            className="w-full py-3 text-center font-bold transition-all active:scale-[0.99]"
            style={
              currentRest === seconds
                ? {
                    background: "var(--color-accent)",
                    color: "#000",
                    border: "1px solid var(--color-accent-80)",
                    clipPath:
                      "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                  }
                : {
                    background: "var(--color-surface-raised)",
                    color: "var(--color-text)",
                    border: "1px solid var(--color-border)",
                    clipPath:
                      "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                  }
            }
          >
            {formatRestTime(seconds)}
          </button>
        ))}
      </div>

      <div className="px-6">
        <button
          onClick={onClose}
          className="w-full py-3 font-bold uppercase tracking-[0.2em] text-sm transition-all active:scale-[0.98]"
          style={{
            background: "var(--color-accent)",
            color: "#000",
            border: "1px solid var(--color-accent-80)",
            clipPath:
              "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
            fontFamily: "monospace",
          }}
        >
          Done
        </button>
      </div>
    </BaseModal>
  );
}
