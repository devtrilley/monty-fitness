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
            className={`w-full py-3 rounded-lg text-center font-medium transition-colors ${
              currentRest === seconds
                ? "bg-accent text-white"
                : "bg-surface-raised text-text hover:bg-border"
            }`}
          >
            {formatRestTime(seconds)}
          </button>
        ))}
      </div>

      <div className="px-6">
        <button
          onClick={onClose}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors"
        >
          Done
        </button>
      </div>
    </BaseModal>
  );
}
