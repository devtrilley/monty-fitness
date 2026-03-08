import BaseModal from "./BaseModal";
import { getSetLabel } from "../utils/setHelpers";

export default function SetTypeModal({
  isOpen,
  onClose,
  currentSet,
  allSets,
  setIndex,
  onSelectType,
  onDelete,
  canDelete,
}) {
  if (!currentSet) return null;

  const currentType = currentSet.set_type || "normal";
  const typeLabel = {
    normal: "Normal Set",
    warmup: "Warm Up",
    failure: "Failure",
    drop: "Drop Set",
  }[currentType];

  const types = [
    {
      key: "normal",
      label: "Normal Set",
      badge: getSetLabel(
        allSets.map((s, i) =>
          i === setIndex ? { ...s, set_type: "normal" } : s
        ),
        setIndex
      ),
      badgeStyle: {
        background: "var(--color-surface-raised)",
        color: "var(--color-text)",
        border: "1px solid var(--color-border)",
      },
    },
    {
      key: "warmup",
      label: "Warm Up",
      badge: "W",
      badgeStyle: {
        background: "rgba(234,179,8,0.15)",
        color: "#facc15",
        border: "1px solid rgba(234,179,8,0.3)",
      },
    },
    {
      key: "failure",
      label: "Failure",
      badge: "F",
      badgeStyle: {
        background: "var(--color-accent-subtle)",
        color: "var(--color-accent)",
        border: "1px solid var(--color-accent-30)",
        boxShadow: "0 0 6px var(--color-accent-30)",
      },
    },
    {
      key: "drop",
      label: "Drop Set",
      badge: "D",
      badgeStyle: {
        background: "rgba(59,130,246,0.15)",
        color: "#60a5fa",
        border: "1px solid rgba(59,130,246,0.3)",
      },
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Set Type: ${typeLabel}`}
    >
      <div className="py-2">
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => onSelectType(t.key)}
            className="w-full px-6 py-4 flex items-center gap-4 transition-colors"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-surface-raised)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              className="w-8 h-8 flex items-center justify-center font-semibold text-sm"
              style={{
                ...t.badgeStyle,
                clipPath:
                  "polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)",
              }}
            >
              {t.badge}
            </div>
            <span
              className="text-base font-medium"
              style={{ color: "var(--color-text)" }}
            >
              {t.label}
            </span>
          </button>
        ))}

        {canDelete && (
          <>
            <div
              style={{
                borderTop: "1px solid var(--color-border)",
                margin: "8px 0",
              }}
            />
            <button
              onClick={onDelete}
              className="w-full px-6 py-4 flex items-center gap-4 transition-colors"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--color-surface-raised)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                className="w-8 h-8 flex items-center justify-center font-semibold text-sm"
                style={{ background: "rgba(239,68,68,0.15)", color: "var(--color-danger)", border: "1px solid rgba(239,68,68,0.3)", clipPath: "polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)" }}
              >
                ×
              </div>
              <span
                className="text-base font-medium"
                style={{ color: "var(--color-danger)" }}
              >
                Remove Set
              </span>
            </button>
          </>
        )}
      </div>
    </BaseModal>
  );
}
