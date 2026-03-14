import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getRoutineById, startWorkout } from "../utils/api";
import { useWorkout } from "../context/WorkoutContext";
import { getSetLabel } from "../utils/setHelpers";
import TopBar from "../components/TopBar";
import ExerciseImage from "../components/ExerciseImage";

export default function ViewRoutine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openSession } = useWorkout();
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const data = await getRoutineById(id);
        setRoutine(data);
      } catch {
        toast.error("Failed to load routine");
      } finally {
        setLoading(false);
      }
    };
    fetchRoutine();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-bg pb-24">
        <TopBar title="Routine" onBack={() => navigate(-1)} />
        <div className="px-6 py-6 animate-pulse space-y-4">
          <div className="h-7 w-48 bg-surface rounded" />
          <div className="h-3 w-32 bg-surface rounded" />
          <div className="flex gap-8 mb-2">
            <div className="h-10 w-16 bg-surface rounded" />
            <div className="h-10 w-16 bg-surface rounded" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-surface border border-border rounded" />
            <div className="w-20 h-12 bg-surface border border-border rounded" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-raised rounded" />
                <div className="h-4 w-36 bg-surface-raised rounded" />
              </div>
              <div className="h-3 w-24 bg-surface-raised rounded" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-8 bg-surface-raised rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (!routine)
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted">Routine not found.</p>
      </div>
    );

  const totalSets = routine.exercises?.reduce(
    (sum, ex) => sum + (ex.sets?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-bg pb-24">
      <TopBar title={routine?.name || "Routine"} onBack={() => navigate(-1)} />
      <div className="px-6 py-6">
        <h2 className="text-2xl font-bold text-text mb-1">{routine.name}</h2>
        {routine.description && (
          <p className="text-sm text-muted mb-4">{routine.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-8 mb-6">
          <div>
            <p className="text-2xl font-bold text-text">
              {routine.exercises?.length || 0}
            </p>
            <p className="text-xs text-muted">Exercises</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{totalSets}</p>
            <p className="text-xs text-muted">Sets</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={async () => {
              try {
                const { session } = await startWorkout(id);
                openSession(session.id);
              } catch {
                toast.error("Failed to start workout");
              }
            }}
            className="flex-1 py-3 active:scale-[0.98] font-bold text-sm tracking-[0.2em] uppercase transition-all"
            style={{
              background: "var(--color-accent)",
              color: "#000",
              border: "1px solid var(--color-accent-80)",
              clipPath:
                "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              fontFamily: "monospace",
            }}
          >
            Start Routine
          </button>
          <button
            onClick={() => navigate(`/workouts/${id}/edit`)}
            className="py-3 px-6 active:scale-[0.98] font-bold text-sm tracking-[0.15em] uppercase transition-all"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-muted)",
              clipPath:
                "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
              fontFamily: "monospace",
            }}
          >
            Edit
          </button>
        </div>
        <h3 className="text-sm font-semibold text-text mb-3">Exercises</h3>

        {(routine.exercises || []).length === 0 && (
          <div className="bg-surface p-8 rounded-xl border border-border text-center">
            <p className="text-muted">No exercises in this routine yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {(routine.exercises || []).map((ex, idx) => (
            <div
              key={idx}
              className="overflow-hidden"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                clipPath:
                  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              }}
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <ExerciseImage
                    imageUrl={ex.exercise?.image_url}
                    name={ex.exercise?.name}
                  />
                  <div>
                    <h4 className="font-semibold text-text">
                      {ex.exercise?.name}
                      <span className="text-xs font-normal text-muted ml-2">
                        ({ex.exercise?.equipment})
                      </span>
                    </h4>
                    {ex.notes && (
                      <p className="text-sm text-muted mt-1">{ex.notes}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-surface-raised border-b border-border">
                <p className="text-xs text-muted">
                  🕐 Rest: {Math.floor(ex.rest_seconds / 60)}min{" "}
                  {ex.rest_seconds % 60}s
                </p>
              </div>
              <div className="p-4">
                {(() => {
                  const showWeight = ex.exercise?.equipment !== "Bodyweight";
                  return (
                    <>
                      <div
                        className={`grid ${
                          showWeight
                            ? "grid-cols-[60px_1fr_1fr]"
                            : "grid-cols-[60px_1fr]"
                        } gap-2 mb-2 text-xs font-medium text-muted uppercase`}
                      >
                        <div>SET</div>
                        {showWeight && <div>LBS</div>}
                        <div>REPS</div>
                      </div>
                      {(ex.sets || []).map((set, i) => (
                        <div
                          key={i}
                          className={`grid ${
                            showWeight
                              ? "grid-cols-[60px_1fr_1fr]"
                              : "grid-cols-[60px_1fr]"
                          } gap-2 py-2 border-t border-border text-sm`}
                        >
                          <div
                            className={`font-medium ${
                              set.type === "warmup"
                                ? "text-yellow-400"
                                : set.type === "failure"
                                ? "text-red-400"
                                : set.type === "drop"
                                ? "text-blue-400"
                                : "text-text"
                            }`}
                          >
                            {getSetLabel(ex.sets, i)}
                          </div>
                          {showWeight && (
                            <div className="text-muted">
                              {set.weight || "—"}
                            </div>
                          )}
                          <div className="text-muted">{set.reps || "—"}</div>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
