import { useEffect } from "react";

export default function ExerciseCardMenu({
  isOpen,
  onClose,
  onReplace,
  onReorder,
  onRemove,
  showReorder = true,
  canRemove = true,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = () => onClose();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg py-2 z-20 w-48">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReplace();
        }}
        className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-raised flex items-center gap-3"
      >
        🔄 Replace Exercise
      </button>
      {showReorder && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReorder();
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-raised flex items-center gap-3"
        >
          ↕️ Reorder Exercises
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={!canRemove}
        className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-raised flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ✕ Remove Exercise
      </button>
    </div>
  );
}
