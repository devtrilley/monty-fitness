import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoutineById, updateRoutine } from "../utils/api";
import toast, { Toaster } from "react-hot-toast";
import ExercisePicker from "../components/ExercisePicker";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getSetLabel } from "../utils/setHelpers";
import TopBar from "../components/TopBar";
import ExerciseImage from "../components/ExerciseImage";

export default function EditRoutine() {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const routine = await getRoutineById(id);
        setName(routine.name);
        setDescription(routine.description || "");
        setSelectedExercises(
          routine.exercises.map((ex) => ({
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            equipment: ex.exercise?.equipment || "",
            image_url: ex.exercise?.image_url || null,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes || "",
            sets: ex.sets || [],
          }))
        );
      } catch {
        toast.error("Failed to load routine");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchRoutine();
  }, [id]);

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
      await updateRoutine(id, {
        name: name.trim(),
        description: description.trim(),
        exercises: selectedExercises,
      });
      toast.success("Routine updated!");
      setTimeout(() => navigate(`/workouts/${id}`), 800);
    } catch {
      toast.error("Failed to update routine");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading)
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-bg">
      <Toaster position="top-center" />
      <TopBar title="Edit Routine" />
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
                          key={`exercise-${ex.exercise_id}-${index}`}
                          draggableId={`exercise-${ex.exercise_id}-${index}`}
                          index={index}
                        >
                          {(provided) => {
                            const showWeight = ex.equipment !== "Bodyweight";
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="bg-surface p-4 rounded-xl border border-border mb-4"
                              >
                                <div className="flex items-center justify-between gap-4 mb-4">
                                  <span
                                    {...provided.dragHandleProps}
                                    className="cursor-grab text-muted hover:text-text text-xl"
                                  >
                                    ☰
                                  </span>
                                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
                                    <ExerciseImage imageUrl={ex.image_url} name={ex.exercise_name} size="sm" />
                                    <h3 className="font-medium text-text truncate">
                                      {ex.exercise_name}
                                    </h3>
                                  </div>
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
                                      className={`h-9 rounded-lg font-medium text-sm ${
                                        set.type === "warmup"
                                          ? "bg-yellow-900/40 text-yellow-400"
                                          : set.type === "failure"
                                          ? "bg-red-900/40 text-red-400"
                                          : set.type === "drop"
                                          ? "bg-blue-900/40 text-blue-400"
                                          : "bg-surface-raised text-text"
                                      }`}
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
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors"
          >
            + Add Exercise
          </button>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-6 py-4 pb-safe flex gap-3">
        <button
          onClick={() => navigate(`/workouts/${id}`)}
          className="flex-1 py-3.5 bg-surface border border-border text-muted font-semibold rounded-xl hover:bg-surface-raised transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-3.5 bg-success hover:bg-green-600 active:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Changes"}
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
