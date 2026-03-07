import BaseModal from './BaseModal';
import { getSetLabel } from "../utils/setHelpers";

export default function SetTypeModal({
  isOpen, onClose, currentSet, allSets,
  setIndex, onSelectType, onDelete, canDelete,
}) {
  if (!currentSet) return null;

  const currentType = currentSet.set_type || "normal";
  const typeLabel = {
    normal: "Normal Set", warmup: "Warm Up",
    failure: "Failure", drop: "Drop Set",
  }[currentType];

  const types = [
    {
      key: "normal",
      label: "Normal Set",
      badge: getSetLabel(allSets.map((s, i) => i === setIndex ? { ...s, set_type: "normal" } : s), setIndex),
      badgeClass: "bg-surface-raised text-text",
    },
    { key: "warmup", label: "Warm Up", badge: "W", badgeClass: "bg-yellow-900/40 text-yellow-400" },
    { key: "failure", label: "Failure", badge: "F", badgeClass: "bg-red-900/40 text-red-400" },
    { key: "drop", label: "Drop Set", badge: "D", badgeClass: "bg-blue-900/40 text-blue-400" },
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Set Type: ${typeLabel}`}>
      <div className="py-2">
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => onSelectType(t.key)}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-surface-raised active:bg-border transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm ${t.badgeClass}`}>
              {t.badge}
            </div>
            <span className="text-base font-medium text-text">{t.label}</span>
          </button>
        ))}

        {canDelete && (
          <>
            <div className="border-t border-border my-2" />
            <button
              onClick={onDelete}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-surface-raised transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-900/40 text-red-400 flex items-center justify-center font-semibold text-sm">
                ×
              </div>
              <span className="text-base font-medium text-danger">Remove Set</span>
            </button>
          </>
        )}
      </div>
    </BaseModal>
  );
}