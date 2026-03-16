import { useState, useRef } from "react";
import { toast } from "./TronToaster";
import { useAuth } from "../context/AuthContext";
import ExerciseImage from "./ExerciseImage";
import ExerciseCardMenu from "./ExerciseCardMenu";
import { getSetLabel } from "../utils/setHelpers";

const formatRestTime = (seconds) => {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs}s`;
};

const getSetStyle = (type) => {
  switch (type) {
    case "warmup":
      return {
        background: "rgba(234,179,8,0.15)",
        color: "#facc15",
        border: "1px solid rgba(234,179,8,0.3)",
      };
    case "failure":
      return {
        background: "var(--color-accent-subtle)",
        color: "var(--color-accent)",
        border: "1px solid var(--color-accent-30)",
        boxShadow: "0 0 6px var(--color-accent-30)",
      };
    case "drop":
      return {
        background: "rgba(59,130,246,0.15)",
        color: "#60a5fa",
        border: "1px solid rgba(59,130,246,0.3)",
      };
    default:
      return {
        background: "var(--color-surface-raised)",
        color: "var(--color-text)",
      };
  }
};

export default function ActiveExerciseCard({
  exercise,
  index,
  completedSets,
  onToggleSetCompletion,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onReplace,
  onRemove,
  onReorder,
  onOpenRestModal,
  onOpenSetTypeModal,
  customRestSeconds,
  canRemove = true,
  onLongPressStart,
  onLongPressEnd,
}) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesMode, setNotesMode] = useState("exercise"); // "exercise" | "set"
  const [swipedSetIdx, setSwipedSetIdx] = useState(null);
  const swipeStartX = useRef(null);
  const showWeight = exercise.exercise?.equipment !== "Bodyweight";
  const hideRir = user?.hide_rir || false;
  const restSeconds = customRestSeconds || exercise.rest_seconds || 120;

  const handleSetTouchStart = (e, setIdx) => {
    swipeStartX.current = e.touches[0].clientX;
  };
  const handleSetTouchEnd = (e, setIdx) => {
    if (swipeStartX.current === null) return;
    const diff = swipeStartX.current - e.changedTouches[0].clientX;
    if (diff > 60) {
      setSwipedSetIdx(setIdx);
    } else if (diff < -20) {
      setSwipedSetIdx(null);
    }
    swipeStartX.current = null;
  };

  return (
    <div
      className="p-4"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        clipPath:
          "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
      }}
    >
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExerciseImage
              imageUrl={exercise.exercise?.image_url}
              name={exercise.exercise?.name}
            />
            <h3
              className="font-semibold text-text cursor-grab"
              onTouchStart={onLongPressStart}
              onTouchEnd={onLongPressEnd}
              onMouseDown={onLongPressStart}
              onMouseUp={onLongPressEnd}
              onMouseLeave={onLongPressEnd}
            >
              {exercise.exercise?.name}
              <span className="text-xs font-normal text-muted ml-1">
                ({exercise.exercise?.equipment})
              </span>
            </h3>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-2 text-muted hover:text-text text-xl font-bold transition-colors"
            >
              ⋮
            </button>
            <ExerciseCardMenu
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              onReplace={() => {
                setMenuOpen(false);
                onReplace(index);
              }}
              onReorder={() => {
                setMenuOpen(false);
                onReorder();
              }}
              onRemove={() => {
                setMenuOpen(false);
                onRemove(index);
              }}
              showReorder={true}
              canRemove={canRemove}
            />
          </div>
        </div>

        {/* Rest Timer Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenRestModal(index);
          }}
          className="flex items-center gap-1 text-sm text-accent mt-2 mb-2 hover:text-accent-hover transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {formatRestTime(restSeconds)}
        </button>
      </div>

      {/* Notes mode toggle */}
      <div className="flex items-center gap-2 mb-2">
        {["exercise", "set"].map((mode) => (
          <button
            key={mode}
            onClick={() => setNotesMode(mode)}
            className="text-[10px] uppercase tracking-[0.12em] px-2 py-1 transition-all"
            style={{
              background:
                notesMode === mode
                  ? "var(--color-accent-subtle)"
                  : "transparent",
              color:
                notesMode === mode
                  ? "var(--color-accent)"
                  : "var(--color-muted)",
              border: `1px solid ${
                notesMode === mode
                  ? "var(--color-accent-30)"
                  : "var(--color-border)"
              }`,
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          >
            {mode === "exercise" ? "Exercise Note" : "Per-Set Notes"}
          </button>
        ))}
      </div>
      {/* Exercise Notes */}
      {notesMode === "exercise" && (
        <textarea
          placeholder="Add exercise notes..."
          rows={2}
          value={exercise.notes || ""}
          onChange={(e) =>
            onUpdateSet(index, -1, "exerciseNotes", e.target.value)
          }
          className="w-full text-sm text-text mb-3 px-2 py-1 border border-border bg-surface-raised rounded focus:outline-none focus:border-accent resize-none max-h-24 placeholder:text-muted"
        />
      )}
      {/* Sets Table */}
      <div className="space-y-2">
        {/* Header */}
        <div
          className={`grid ${
            showWeight && !hideRir
              ? "grid-cols-[35px_64px_62px_62px_42px]"
              : showWeight && hideRir
              ? "grid-cols-[35px_64px_62px_42px]"
              : !hideRir
              ? "grid-cols-[35px_62px_62px_42px]"
              : "grid-cols-[35px_62px_42px]"
          } gap-1.5 text-[10px] font-medium text-muted uppercase`}
        >
          <div className="text-center">SET</div>
          {showWeight && <div className="text-center">LBS</div>}
          <div className="text-center">REPS</div>
          {!hideRir && <div className="text-center">RIR</div>}
          <div className="text-center">✓</div>
        </div>

        {/* Set Rows */}
        {exercise.sets.map((set, setIdx) => {
          const setKey = `${index}-${setIdx}`;
          const isCompleted = completedSets.has(setKey);
          const lastSet = exercise.last_performance?.[setIdx];
          const isSwiped = swipedSetIdx === setIdx;
          return (
            <div key={set.id} className="relative overflow-hidden rounded-md">
              {/* Swipe delete reveal */}
              {isSwiped && onRemoveSet && !isCompleted && (
                <button
                  onClick={() => {
                    setSwipedSetIdx(null);
                    onRemoveSet(index, setIdx);
                  }}
                  className="absolute right-0 top-0 bottom-0 flex items-center justify-center px-4 z-10"
                  style={{
                    background: "var(--color-danger)",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  Delete
                </button>
              )}
              <div
                onTouchStart={(e) => handleSetTouchStart(e, setIdx)}
                onTouchEnd={(e) => handleSetTouchEnd(e, setIdx)}
                onClick={() => swipedSetIdx !== null && setSwipedSetIdx(null)}
                className={`grid ${
                  showWeight && !hideRir
                    ? "grid-cols-[35px_64px_62px_62px_42px]"
                    : showWeight && hideRir
                    ? "grid-cols-[35px_64px_62px_42px]"
                    : !hideRir
                    ? "grid-cols-[35px_62px_62px_42px]"
                    : "grid-cols-[35px_62px_42px]"
                } gap-1.5 items-center -mx-4 px-4 py-1 transition-all`}
                style={{
                  background: isCompleted
                    ? "rgba(34,197,94,0.12)"
                    : setIdx % 2 === 0
                    ? "var(--color-surface-raised)"
                    : "var(--color-surface)",
                  borderLeft: isCompleted
                    ? "2px solid var(--color-success)"
                    : "none",
                  transform: isSwiped ? "translateX(-80px)" : "translateX(0)",
                  transition: "transform 0.2s ease",
                }}
              >
                {/* Set Type Button */}
                <button
                  onClick={() => onOpenSetTypeModal(index, setIdx)}
                  disabled={isCompleted}
                  className={`font-medium text-center h-9 w-9 rounded-lg transition-all ${
                    isCompleted
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-80"
                  }`}
                  style={getSetStyle(set.set_type)}
                >
                  {getSetLabel(exercise.sets, setIdx)}
                </button>

                {/* Weight Input */}
                {showWeight && (
                  <input
                    type="number"
                    value={set.weight ?? ""}
                    min="0"
                    onChange={(e) => {
                      const v = e.target.value;
                      onUpdateSet(
                        index,
                        setIdx,
                        "weight",
                        v === "" ? null : Math.max(0, parseFloat(v))
                      );
                    }}
                    onWheel={(e) => e.target.blur()}
                    disabled={isCompleted}
                    placeholder={lastSet?.weight ? String(lastSet.weight) : "—"}
                    className="h-9 px-1 border border-border bg-surface-raised text-text rounded-lg text-xs text-center placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                )}

                {/* Reps Input */}
                <input
                  type="number"
                  value={set.reps ?? ""}
                  min="0"
                  onChange={(e) => {
                    const v = e.target.value;
                    onUpdateSet(
                      index,
                      setIdx,
                      "reps",
                      v === "" ? null : Math.max(0, parseInt(v))
                    );
                  }}
                  onWheel={(e) => e.target.blur()}
                  disabled={isCompleted}
                  placeholder={lastSet?.reps ? String(lastSet.reps) : "—"}
                  className="h-9 px-2 border border-border bg-surface-raised text-text rounded-lg text-sm text-center placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                />

                {/* RIR Input */}
                {!hideRir && (
                  <input
                    type="number"
                    value={set.rir ?? ""}
                    min="0"
                    max="10"
                    onChange={(e) => {
                      const v = e.target.value;
                      onUpdateSet(
                        index,
                        setIdx,
                        "rir",
                        v === "" ? null : Math.max(0, parseInt(v))
                      );
                    }}
                    onWheel={(e) => e.target.blur()}
                    disabled={isCompleted}
                    placeholder="—"
                    className="h-9 px-2 border border-border bg-surface-raised text-text rounded-lg text-sm text-center placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                )}

                {/* Completion Checkbox */}
                <button
                  onClick={() => {
                    if (!isCompleted) {
                      if (
                        set.reps === null ||
                        set.reps === undefined ||
                        set.reps === ""
                      ) {
                        toast.error("Enter reps before completing this set.");
                        return;
                      }
                      if (
                        showWeight &&
                        (set.weight === null ||
                          set.weight === undefined ||
                          set.weight === "")
                      ) {
                        toast.error("Enter weight before completing this set.");
                        return;
                      }
                    }
                    onToggleSetCompletion(index, setIdx, restSeconds);
                  }}
                  className="h-9 w-9 rounded-lg flex items-center justify-center transition-all"
                  style={
                    isCompleted
                      ? {
                          background: "var(--color-accent)",
                          border: "2px solid var(--color-accent)",
                          color: "#fff",
                          boxShadow: "0 0 8px var(--color-accent-60)",
                        }
                      : {
                          border: "2px solid var(--color-border)",
                          color: "var(--color-muted)",
                        }
                  }
                >
                  {isCompleted && "✓"}
                </button>
              </div>
              {/* Per-set notes */}
              {notesMode === "set" && (
                <input
                  type="text"
                  value={set.notes || ""}
                  onChange={(e) =>
                    onUpdateSet(index, setIdx, "notes", e.target.value)
                  }
                  placeholder="Set note..."
                  disabled={isCompleted}
                  className="w-full text-xs text-text px-2 py-1 mt-0.5 border-t border-border bg-surface-raised focus:outline-none placeholder:text-muted"
                  style={{ borderRadius: "0 0 4px 4px" }}
                />
              )}
            </div>
          );
        })}
        {/* Add Set Button */}
        <button
          onClick={() => onAddSet(index)}
          className="w-full py-2 mt-2 text-sm text-accent hover:text-accent-hover border border-dashed border-accent/40 rounded-lg transition-colors"
        >
          + Add Set
        </button>
      </div>
    </div>
  );
}
