import { useState } from "react";
import { createPortal } from "react-dom";
import ExerciseImage from "./ExerciseImage";
import ExerciseCardMenu from "./ExerciseCardMenu";
import SetTypeModal from "./SetTypeModal";
import { getSetLabel } from "../utils/setHelpers";

export default function RoutineExerciseCard({
  exercise,
  index,
  onUpdate,
  onRemove,
  onReplace,
  onReorder,
  showReorder,
  totalExercises,
  onLongPressStart,
  onLongPressEnd,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [setTypeModalIdx, setSetTypeModalIdx] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const showWeight = exercise.equipment !== "Bodyweight";

  const updateField = (field, value) => {
    onUpdate(index, { ...exercise, [field]: value });
  };

  const updateSet = (setIndex, field, value) => {
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    onUpdate(index, { ...exercise, sets: newSets });
  };

  const handleSetTypeSelect = (type) => {
    updateSet(setTypeModalIdx, "type", type);
    setSetTypeModalIdx(null);
  };

  const addSet = () => {
    const newSets = [
      ...(exercise.sets || []),
      { type: "normal", weight: "", reps: "" },
    ];
    onUpdate(index, { ...exercise, sets: newSets });
  };

  const removeSet = (setIndex) => {
    const newSets = exercise.sets.filter((_, i) => i !== setIndex);
    onUpdate(index, { ...exercise, sets: newSets });
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
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={() => exercise.image_url && setLightboxOpen(true)}
          className="flex-shrink-0"
        >
          <ExerciseImage
            imageUrl={exercise.image_url}
            name={exercise.exercise_name}
            size="sm"
          />
        </button>
        <h3
          className="font-medium text-text flex-1 truncate cursor-grab"
          onTouchStart={onLongPressStart}
          onTouchEnd={onLongPressEnd}
          onMouseDown={onLongPressStart}
          onMouseUp={onLongPressEnd}
          onMouseLeave={onLongPressEnd}
        >
          {exercise.exercise_name} ({exercise.equipment})
        </h3>
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
            showReorder={showReorder && totalExercises > 1}
            canRemove={true}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-muted mb-1">
          Note
        </label>
        <textarea
          value={exercise.notes || ""}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="e.g. Focus on hypertrophy, slow eccentric"
          rows={2}
          className="w-full px-3 py-2 border border-border bg-surface-raised text-text rounded-lg text-sm placeholder:text-muted"
        />
      </div>

      {/* Rest Timer */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-muted mb-1">
          Rest Timer:
        </label>
        <select
          value={exercise.rest_seconds}
          onChange={(e) =>
            updateField("rest_seconds", parseInt(e.target.value))
          }
          className="w-full px-3 py-2 border border-border bg-surface-raised text-text rounded-lg text-sm"
        >
          <option value={60}>01:00</option>
          <option value={90}>01:30</option>
          <option value={120}>02:00</option>
          <option value={150}>02:30</option>
          <option value={180}>03:00</option>
          <option value={240}>04:00</option>
          <option value={300}>05:00</option>
        </select>
      </div>

      {/* Sets Header */}
      <div
        className={`grid ${
          showWeight
            ? "grid-cols-[50px_80px_80px_36px]"
            : "grid-cols-[50px_80px_36px]"
        } gap-1.5 mb-2 text-xs font-medium text-muted uppercase`}
      >
        <div>SET</div>
        {showWeight && <div>LBS</div>}
        <div>REPS</div>
        <div></div>
      </div>

      {/* Sets */}
      {(exercise.sets || []).map((set, setIndex) => (
        <div
          key={setIndex}
          className={`grid ${
            showWeight
              ? "grid-cols-[50px_80px_80px_36px]"
              : "grid-cols-[50px_80px_36px]"
          } gap-1.5 mb-2 items-center`}
        >
          <button
            onClick={() => setSetTypeModalIdx(setIndex)}
            className="h-9 rounded-lg font-medium text-sm"
            style={getSetStyle(set.type)}
          >
            {getSetLabel(exercise.sets, setIndex)}
          </button>
          {showWeight && (
            <input
              type="number"
              value={set.weight ?? ""}
              min="0"
              onChange={(e) => {
                const v = e.target.value;
                updateSet(
                  setIndex,
                  "weight",
                  v === "" ? "" : Math.max(0, parseFloat(v))
                );
              }}
              onWheel={(e) => e.target.blur()}
              placeholder="—"
              className="h-9 px-2 border border-border bg-surface-raised text-text rounded-lg text-sm text-center placeholder:text-muted"
            />
          )}
          <input
            type="number"
            value={set.reps ?? ""}
            min="0"
            onChange={(e) => {
              const v = e.target.value;
              updateSet(
                setIndex,
                "reps",
                v === "" ? "" : Math.max(0, parseInt(v))
              );
            }}
            onWheel={(e) => e.target.blur()}
            placeholder="—"
            className="h-9 px-2 border border-border bg-surface-raised text-text rounded-lg text-sm text-center placeholder:text-muted"
          />
          <button
            onClick={() => removeSet(setIndex)}
            className="h-9 w-9 flex items-center justify-center text-muted hover:text-danger text-xl"
          >
            ×
          </button>
        </div>
      ))}

      {/* Add Set */}
      <button
        onClick={addSet}
        className="w-full py-2 text-sm text-muted hover:text-text border border-dashed border-border rounded-lg mt-2 transition-colors"
      >
        + Add set
      </button>

      {createPortal(
        <SetTypeModal
          isOpen={setTypeModalIdx !== null}
          onClose={() => setSetTypeModalIdx(null)}
          currentSet={
            setTypeModalIdx !== null ? exercise.sets[setTypeModalIdx] : null
          }
          allSets={exercise.sets}
          setIndex={setTypeModalIdx ?? 0}
          onSelectType={handleSetTypeSelect}
          onDelete={() => {
            removeSet(setTypeModalIdx);
            setSetTypeModalIdx(null);
          }}
          canDelete={true}
        />,
        document.body
      )}

      {lightboxOpen &&
        exercise.image_url &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.92)" }}
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={exercise.image_url}
              alt={exercise.exercise_name}
              className="max-w-[90vw] max-h-[80vh] object-contain"
              style={{
                clipPath:
                  "polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)",
              }}
            />
            <p
              className="absolute bottom-10 left-0 right-0 text-center"
              style={{
                color: "var(--color-muted)",
                fontFamily: "monospace",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {exercise.exercise_name} — tap to close
            </p>
          </div>,
          document.body
        )}
    </div>
  );
}
