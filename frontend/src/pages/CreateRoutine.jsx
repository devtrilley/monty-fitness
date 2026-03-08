import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createRoutine } from "../utils/api";
import toast from "react-hot-toast";
import TronToaster from "../components/TronToaster";
import ExercisePicker from "../components/ExercisePicker";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getSetLabel } from "../utils/setHelpers";
import TopBar from "../components/TopBar";

export default function CreateRoutine() {
  const [name, setName] = useState(
    () => localStorage.getItem("routine_name") || ""
  );
  const [description, setDescription] = useState(
    () => localStorage.getItem("routine_description") || ""
  );
  const [selectedExercises, setSelectedExercises] = useState(() => {
    const saved = localStorage.getItem("routine_exercises");
    return saved ? JSON.parse(saved) : [];
  });
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("routine_name", name);
    localStorage.setItem("routine_description", description);
    localStorage.setItem(
      "routine_exercises",
      JSON.stringify(selectedExercises)
    );
  }, [name, description, selectedExercises]);

  const addExercises = (exercises) => {
    const newExercises = exercises.filter(
      (ex) => !selectedExercises.find((e) => e.exercise_id === ex.id)
    );
    if (newExercises.length === 0) {
      toast.error("All selected exercises already added");
      return;
    }
    setSelectedExercises([
      ...selectedExercises,
      ...newExercises.map((ex) => ({
        exercise_id: ex.id,
        exercise_name: ex.name,
        equipment: ex.equipment,
        image_url: ex.image_url || null,
        rest_seconds: 120,
        notes: "",
        sets: [{ type: "normal", weight: "", reps: "" }],
      })),
    ]);
    setShowExercisePicker(false);
    toast.success(
      `${newExercises.length} exercise${
        newExercises.length > 1 ? "s" : ""
      } added`
    );
  };

  const removeExercise = (index) =>
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Routine name is required");
      return;
    }
    if (selectedExercises.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    setLoading(true);
    try {
      await createRoutine({
        name: name.trim(),
        description: description.trim(),
        exercises: selectedExercises,
      });
      toast.success("Routine created!");
      localStorage.removeItem("routine_name");
      localStorage.removeItem("routine_description");
      localStorage.removeItem("routine_exercises");
      setTimeout(() => navigate("/workouts"), 800);
    } catch {
      toast.error("Failed to create routine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <TronToaster />
      <TopBar title="Create Routine" />
      <div className="px-6 py-6 pb-32">
        <div className="mb-6">
          <label className="block text-sm font-medium text-text mb-2">
            Routine Title
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day, Full Body"
            className="w-full px-4 py-3 border border-border bg-surface-raised text-text rounded-xl focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-text mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes about this routine..."
            rows={3}
            className="w-full px-4 py-3 border border-border bg-surface-raised text-text rounded-xl focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
          />
        </div>

        <div>
          <h2 className="text-sm font-medium text-text mb-3">Exercises</h2>
          {selectedExercises.length === 0 ? (
            <div className="bg-surface p-8 rounded-xl border border-border text-center mb-4">
              <p className="text-muted mb-2">No exercises added yet</p>
              <p className="text-sm text-muted">
                Add exercises to build your routine
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              <DragDropContext
                onDragEnd={(result) => {
                  if (!result.destination) return;
                  const items = Array.from(selectedExercises);
                  const [moved] = items.splice(result.source.index, 1);
                  items.splice(result.destination.index, 0, moved);
                  setSelectedExercises(items);
                }}
              >
                <Droppable droppableId="exercises">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {selectedExercises.map((ex, index) => (
                        <Draggable
                          key={`exercise-${ex.exercise_id}`}
                          draggableId={`exercise-${ex.exercise_id}`}
                          index={index}
                        >
                          {(provided) => {
                            const showWeight = ex.equipment !== "Bodyweight";
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="p-4 mb-4"
                                style={{
                                  background: "var(--color-surface)",
                                  border: "1px solid var(--color-border)",
                                  clipPath:
                                    "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
                                }}
                              >
                                <div className="flex items-center justify-between gap-4 mb-4">
                                  <span
                                    {...provided.dragHandleProps}
                                    className="cursor-grab text-muted hover:text-text text-xl"
                                  >
                                    ☰
                                  </span>
                                  {ex.image_url && (
                                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-surface-raised">
                                      <img
                                        src={ex.image_url}
                                        alt={ex.exercise_name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                        }}
                                      />
                                    </div>
                                  )}
                                  <h3 className="font-medium text-text text-center flex-1 truncate">
                                    {ex.exercise_name}
                                  </h3>
                                  <button
                                    onClick={() => removeExercise(index)}
                                    className="text-danger text-sm hover:text-red-400 flex-shrink-0"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="mb-4">
                                  <label className="block text-xs font-medium text-muted mb-1">
                                    Note
                                  </label>
                                  <textarea
                                    value={ex.notes || ""}
                                    onChange={(e) => {
                                      const u = [...selectedExercises];
                                      u[index].notes = e.target.value;
                                      setSelectedExercises(u);
                                    }}
                                    placeholder="e.g. Focus on hypertrophy, slow eccentric"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-border bg-surface-raised text-text rounded-lg text-sm placeholder:text-muted"
                                  />
                                </div>
                                <div className="mb-4">
                                  <label className="block text-xs font-medium text-muted mb-1">
                                    Rest Timer:
                                  </label>
                                  <select
                                    value={ex.rest_seconds}
                                    onChange={(e) => {
                                      const u = [...selectedExercises];
                                      u[index].rest_seconds = parseInt(
                                        e.target.value
                                      );
                                      setSelectedExercises(u);
                                    }}
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
                                {(ex.sets || []).map((set, setIndex) => (
                                  <div
                                    key={setIndex}
                                    className={`grid ${
                                      showWeight
                                        ? "grid-cols-[50px_80px_80px_36px]"
                                        : "grid-cols-[50px_80px_36px]"
                                    } gap-1.5 mb-2 items-center`}
                                  >
                                    <button
                                      onClick={() => {
                                        const u = [...selectedExercises];
                                        const types = [
                                          "normal",
                                          "warmup",
                                          "failure",
                                          "drop",
                                        ];
                                        u[index].sets[setIndex].type =
                                          types[
                                            (types.indexOf(
                                              set.type || "normal"
                                            ) +
                                              1) %
                                              types.length
                                          ];
                                        setSelectedExercises(u);
                                      }}
                                      className="h-9 rounded-lg font-medium text-sm"
                                      style={
                                        set.type === "warmup"
                                          ? {
                                              background:
                                                "rgba(234,179,8,0.15)",
                                              color: "#facc15",
                                              border:
                                                "1px solid rgba(234,179,8,0.3)",
                                            }
                                          : set.type === "failure"
                                          ? {
                                              background:
                                                "var(--color-accent-subtle)",
                                              color: "var(--color-accent)",
                                              border:
                                                "1px solid var(--color-accent-30)",
                                              boxShadow:
                                                "0 0 6px var(--color-accent-30)",
                                            }
                                          : set.type === "drop"
                                          ? {
                                              background:
                                                "rgba(59,130,246,0.15)",
                                              color: "#60a5fa",
                                              border:
                                                "1px solid rgba(59,130,246,0.3)",
                                            }
                                          : {
                                              background:
                                                "var(--color-surface-raised)",
                                              color: "var(--color-text)",
                                            }
                                      }
                                    >
                                      {getSetLabel(ex.sets, setIndex)}
                                    </button>
                                    {showWeight && (
                                      <input
                                        type="number"
                                        value={set.weight ?? ""}
                                        min="0"
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          const u = [...selectedExercises];
                                          u[index].sets[setIndex].weight =
                                            v === ""
                                              ? ""
                                              : Math.max(0, parseFloat(v));
                                          setSelectedExercises(u);
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
                                        const u = [...selectedExercises];
                                        u[index].sets[setIndex].reps =
                                          v === ""
                                            ? ""
                                            : Math.max(0, parseInt(v));
                                        setSelectedExercises(u);
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                      placeholder="—"
                                      className="h-9 px-2 border border-border bg-surface-raised text-text rounded-lg text-sm text-center placeholder:text-muted"
                                    />
                                    <button
                                      onClick={() => {
                                        const u = [...selectedExercises];
                                        u[index].sets = u[index].sets.filter(
                                          (_, i) => i !== setIndex
                                        );
                                        setSelectedExercises(u);
                                      }}
                                      className="h-9 w-9 flex items-center justify-center text-muted hover:text-danger text-xl"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const u = [...selectedExercises];
                                    if (!u[index].sets) u[index].sets = [];
                                    u[index].sets.push({
                                      type: "normal",
                                      weight: "",
                                      reps: "",
                                    });
                                    setSelectedExercises(u);
                                  }}
                                  className="w-full py-2 text-sm text-muted hover:text-text border border-dashed border-border rounded-lg mt-2 transition-colors"
                                >
                                  + Add set
                                </button>
                              </div>
                            );
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
          <button
            onClick={() => setShowExercisePicker(true)}
            className="w-full py-3 font-bold transition-all tracking-[0.2em] uppercase text-sm active:scale-[0.98]"
            style={{
              background: "var(--color-accent)",
              color: "#000",
              border: "1px solid var(--color-accent-80)",
              clipPath:
                "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              fontFamily: "monospace",
            }}
          >
            + Add Exercise
          </button>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-6 py-4 pb-safe flex gap-3">
        <button
          onClick={() => {
            localStorage.removeItem("routine_name");
            localStorage.removeItem("routine_description");
            localStorage.removeItem("routine_exercises");
            navigate("/workouts");
          }}
          className="flex-1 py-3.5 font-bold uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98]"
          style={{
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted)",
            clipPath:
              "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
            fontFamily: "monospace",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-3.5 font-bold uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-success)",
            color: "#000",
            border: "1px solid var(--color-success)",
            clipPath:
              "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
            fontFamily: "monospace",
          }}
        >
          {loading ? "Saving..." : "Save Routine"}
        </button>
      </div>

      <ExercisePicker
        isOpen={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelectExercises={addExercises}
        multiSelect
        alreadyAdded={selectedExercises.map((e) => e.exercise_id)}
      />
    </div>
  );
}
