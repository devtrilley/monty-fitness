import { useState, useEffect } from "react";
import { getExercises } from "../utils/api";
import axios from "axios";
import BaseModal from "./BaseModal";
import ExerciseImage from "./ExerciseImage";

const SYNONYMS = {
  "shoulder press": ["overhead press", "military press", "ohp"],
  "overhead press": ["shoulder press", "military press", "ohp"],
  "military press": ["shoulder press", "overhead press", "ohp"],
  ohp: ["overhead press", "shoulder press", "military press"],
  "pull up": ["pullup", "pull-up", "chin up", "chinup"],
  pullup: ["pull up", "pull-up", "chin up"],
  "chin up": ["pull up", "chinup", "pull-up"],
  "push up": ["pushup", "push-up"],
  bench: ["bench press", "chest press"],
  squat: ["back squat", "front squat", "goblet squat"],
  deadlift: ["romanian deadlift", "rdl", "sumo deadlift"],
  rdl: ["romanian deadlift", "stiff leg"],
  curl: ["bicep curl", "hammer curl", "barbell curl"],
  row: ["bent over row", "cable row", "seated row", "dumbbell row"],
  lunge: ["walking lunge", "reverse lunge", "split squat"],
  fly: ["chest fly", "cable fly", "pec fly", "flye"],
  flye: ["fly", "chest fly", "cable fly"],
  press: ["bench press", "shoulder press", "overhead press", "chest press"],
  "calf raise": ["standing calf raise", "seated calf raise"],
  "lat pulldown": ["pulldown", "cable pulldown"],
  tricep: ["triceps", "tricep extension", "skull crusher", "pushdown"],
  triceps: ["tricep", "tricep extension", "skull crusher"],
};

function matchesSearch(exercise, term) {
  if (!term) return true;
  const lower = term.toLowerCase().trim();
  const name = exercise.name.toLowerCase();
  const equipment = exercise.equipment?.toLowerCase() || "";
  const muscle = exercise.primary_muscle?.toLowerCase() || "";

  if (
    name.includes(lower) ||
    equipment.includes(lower) ||
    muscle.includes(lower)
  )
    return true;

  const synonyms = SYNONYMS[lower] || [];
  for (const syn of synonyms) {
    if (name.includes(syn)) return true;
  }

  const words = lower.split(" ");
  if (words.length > 1 && words.every((w) => name.includes(w))) return true;

  return false;
}

export default function ExercisePicker({
  isOpen,
  onClose,
  onSelectExercise,
  onSelectExercises,
  multiSelect = false,
  alreadyAdded = [],
}) {
  const [exercises, setExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [muscleOptions, setMuscleOptions] = useState([]);
  const [activeEquipment, setActiveEquipment] = useState(null);
  const [activeMuscle, setActiveMuscle] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSelected([]);
      setSearchTerm("");
      setActiveEquipment(null);
      setActiveMuscle(null);
      const fetchData = async () => {
        try {
          const [exData, filterData] = await Promise.all([
            getExercises(),
            axios.get("http://127.0.0.1:5000/api/exercises/filters"),
          ]);
          setExercises(exData.exercises || []);
          const eq = filterData.data.equipment || [];
          const mu = filterData.data.muscles || [];
          setEquipmentOptions(eq.sort());
          setMuscleOptions(mu.sort());
        } catch (error) {
          console.error("Failed to load exercises:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const filteredExercises = exercises.filter((ex) => {
    if (!matchesSearch(ex, searchTerm)) return false;
    if (activeEquipment && ex.equipment !== activeEquipment) return false;
    if (activeMuscle && ex.primary_muscle !== activeMuscle) return false;
    return true;
  });

  const toggleSelect = (exercise) => {
    setSelected((prev) =>
      prev.find((e) => e.id === exercise.id)
        ? prev.filter((e) => e.id !== exercise.id)
        : [...prev, exercise]
    );
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onSelectExercises(selected);
    setSelected([]);
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={multiSelect ? "Add Exercises" : "Select Exercise"}
    >
      <div className="flex flex-col" style={{ maxHeight: "78vh" }}>
        <div className="px-6 pt-4 pb-3 border-b border-border flex-shrink-0 space-y-3">
          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, muscle, or equipment..."
            className="w-full px-4 py-3 border border-border bg-surface-raised text-text rounded-xl focus:outline-none focus:ring-1 focus:ring-accent text-sm placeholder:text-muted"
            autoFocus
          />

          {/* Filter buttons */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={activeEquipment || ""}
                onChange={(e) => setActiveEquipment(e.target.value || null)}
                className={`w-full px-3 py-2 rounded-xl text-sm font-medium border appearance-none cursor-pointer transition-colors ${
                  activeEquipment
                    ? "bg-accent text-white border-accent"
                    : "bg-surface-raised text-text border-border hover:bg-surface"
                }`}
              >
                <option value="">All Equipment</option>
                {equipmentOptions.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
              <div
                className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${
                  activeEquipment ? "text-white" : "text-muted"
                }`}
              >
                ▾
              </div>
            </div>

            <div className="relative flex-1">
              <select
                value={activeMuscle || ""}
                onChange={(e) => setActiveMuscle(e.target.value || null)}
                className={`w-full px-3 py-2 rounded-xl text-sm font-medium border appearance-none cursor-pointer transition-colors ${
                  activeMuscle
                    ? "bg-accent text-white border-accent"
                    : "bg-surface-raised text-text border-border hover:bg-surface"
                }`}
              >
                <option value="">All Muscles</option>
                {muscleOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div
                className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 ${
                  activeMuscle ? "text-white" : "text-muted"
                }`}
              >
                ▾
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        {(searchTerm || activeEquipment || activeMuscle) && (
          <div className="px-4 pt-3 pb-1 flex-shrink-0">
            <p className="text-xs text-muted">
              {filteredExercises.length} result
              {filteredExercises.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-muted py-8">Loading exercises...</p>
          ) : (
            <div className="space-y-2">
              {filteredExercises.map((exercise) => {
                const isAlreadyAdded = alreadyAdded.includes(exercise.id);
                const isSelected = selected.find((e) => e.id === exercise.id);
                return (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      if (isAlreadyAdded) return;
                      if (multiSelect) {
                        toggleSelect(exercise);
                      } else {
                        onSelectExercise(exercise);
                      }
                    }}
                    disabled={isAlreadyAdded}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors border ${
                      isAlreadyAdded
                        ? "bg-surface-raised opacity-40 cursor-not-allowed border-border"
                        : isSelected
                        ? "bg-accent-subtle border-accent"
                        : "bg-surface hover:bg-surface-raised border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ExerciseImage
                        imageUrl={exercise.image_url}
                        name={exercise.name}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-text text-sm">
                          {exercise.name}{" "}
                          <span className="text-muted font-normal">
                            ({exercise.equipment})
                          </span>
                        </p>
                        {exercise.primary_muscle && (
                          <p className="text-xs text-muted mt-0.5">
                            {exercise.primary_muscle}
                          </p>
                        )}
                      </div>
                    </div>
                    {multiSelect ? (
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-accent border-accent"
                            : "border-border"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 12 12"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    ) : (
                      <span className="text-accent text-xl flex-shrink-0">
                        +
                      </span>
                    )}
                  </button>
                );
              })}
              {filteredExercises.length === 0 && (
                <p className="text-center text-muted py-8">
                  No exercises found
                </p>
              )}
            </div>
          )}
        </div>

        {/* Multi-select footer */}
        {multiSelect && (
          <div className="p-4 border-t border-border flex-shrink-0 bg-surface">
            <button
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selected.length === 0
                ? "Select exercises"
                : `Add ${selected.length} Exercise${
                    selected.length > 1 ? "s" : ""
                  }`}
            </button>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
