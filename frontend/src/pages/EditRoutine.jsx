import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useNavigate, useParams } from "react-router-dom";
import { getRoutineById, updateRoutine } from "../utils/api";
import toast from "react-hot-toast";
import TronToaster from "../components/TronToaster";
import ExercisePicker from "../components/ExercisePicker";
import RoutineExerciseCard from "../components/RoutineExerciseCard";

export default function EditRoutine() {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [replacingExerciseIdx, setReplacingExerciseIdx] = useState(null);
  const [reorderMode, setReorderMode] = useState(false);
  const longPressTimer = useRef(null);
  const navigate = useNavigate();

  const handleLongPressStart = () => {
    if (selectedExercises.length < 2) return;
    longPressTimer.current = setTimeout(() => {
      setReorderMode(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(selectedExercises);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSelectedExercises(reordered);
    setReorderMode(false);
  };

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

  const handleReplaceExercise = (newExercise) => {
    const updated = [...selectedExercises];
    updated[replacingExerciseIdx] = {
      ...updated[replacingExerciseIdx],
      exercise_id: newExercise.id,
      exercise_name: newExercise.name,
      equipment: newExercise.equipment,
      image_url: newExercise.image_url || null,
    };
    setSelectedExercises(updated);
    setShowExercisePicker(false);
    setReplacingExerciseIdx(null);
    toast.success("Exercise replaced");
  };

  const updateExercise = (index, updatedExercise) => {
    const updated = [...selectedExercises];
    updated[index] = updatedExercise;
    setSelectedExercises(updated);
  };

  const removeExercise = (index) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

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
      <div className="min-h-screen bg-bg">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="h-5 w-14 bg-surface-raised rounded" />
          <div className="h-5 w-24 bg-surface-raised rounded" />
          <div className="h-8 w-12 bg-surface-raised rounded-lg" />
        </div>
        <div className="px-6 py-6 pb-40 animate-pulse space-y-6">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-surface rounded" />
            <div className="h-12 bg-surface border border-border rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 bg-surface rounded" />
            <div className="h-24 bg-surface border border-border rounded-xl" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-raised rounded-full" />
                <div className="h-4 w-36 bg-surface-raised rounded" />
              </div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-10 bg-surface-raised rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-bg">
      <TronToaster />
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(`/workouts/${id}`)}
          className="text-accent font-medium"
        >
          Cancel
        </button>
        <h1 className="text-lg font-semibold text-text">Edit Routine</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-1.5 font-bold text-sm rounded-lg disabled:opacity-40"
          style={{
            background: "var(--color-accent)",
            color: "#000",
          }}
        >
          {loading ? "..." : "Save"}
        </button>
      </div>
      <div className="px-6 py-6 pb-40">
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text">Exercises</h2>
          </div>
          {selectedExercises.length === 0 ? (
            <div className="bg-surface p-8 rounded-xl border border-border text-center mb-4">
              <p className="text-muted mb-2">No exercises added yet</p>
              <p className="text-sm text-muted">
                Add exercises to build your routine
              </p>
            </div>
          ) : reorderMode ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="inline-reorder">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 mb-4"
                  >
                    {selectedExercises.map((ex, index) => (
                      <Draggable
                        key={`reorder-${ex.exercise_id}-${index}`}
                        draggableId={`reorder-${ex.exercise_id}-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-3 p-3 rounded-lg transition-all"
                            style={{
                              background: snapshot.isDragging
                                ? "var(--color-accent-subtle)"
                                : "var(--color-surface)",
                              border: snapshot.isDragging
                                ? "2px solid var(--color-accent)"
                                : "1px solid var(--color-border)",
                              boxShadow: snapshot.isDragging
                                ? "0 8px 32px rgba(0,200,255,0.3)"
                                : "none",
                              ...provided.draggableProps.style,
                            }}
                          >
                            <img
                              src={ex.image_url || "/placeholder-exercise.png"}
                              alt={ex.exercise_name}
                              className="w-10 h-10 rounded-full object-cover bg-surface-raised"
                            />
                            <span className="text-accent font-medium flex-1">
                              {ex.exercise_name} ({ex.equipment})
                            </span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="space-y-4 mb-4">
              {selectedExercises.map((ex, index) => (
                <RoutineExerciseCard
                  key={`exercise-${ex.exercise_id}-${index}`}
                  exercise={ex}
                  index={index}
                  onUpdate={updateExercise}
                  onRemove={removeExercise}
                  onReplace={(idx) => {
                    setReplacingExerciseIdx(idx);
                    setShowExercisePicker(true);
                  }}
                  onReorder={() => setReorderMode(true)}
                  showReorder={true}
                  totalExercises={selectedExercises.length}
                  onLongPressStart={handleLongPressStart}
                  onLongPressEnd={handleLongPressEnd}
                />
              ))}
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
      <ExercisePicker
        isOpen={showExercisePicker}
        onClose={() => {
          setShowExercisePicker(false);
          setReplacingExerciseIdx(null);
        }}
        onSelectExercise={
          replacingExerciseIdx !== null ? handleReplaceExercise : undefined
        }
        onSelectExercises={
          replacingExerciseIdx === null ? addExercises : undefined
        }
        multiSelect={replacingExerciseIdx === null}
        alreadyAdded={selectedExercises.map((e) => e.exercise_id)}
      />
    </div>
  );
}
