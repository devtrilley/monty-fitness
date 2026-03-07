import { useParams, useNavigate } from "react-router-dom";
import { getCompletedWorkout } from "../utils/api";
import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import ExerciseImage from "../components/ExerciseImage";

export default function WorkoutDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);

  useEffect(() => {
    getCompletedWorkout(id).then((data) => setWorkout(data));
  }, [id]);

  if (!workout)
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopBar title="Workout Details" onBack={() => navigate(-1)} />
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-text mb-1">{workout.name}</h1>
        <p className="text-sm text-muted mb-6">
          {new Date(workout.session_date).toLocaleDateString()} &nbsp;·&nbsp;
          {workout.duration_minutes || 0} min &nbsp;·&nbsp;
          {workout.completed_sets || 0} sets
        </p>

        <div className="space-y-3">
          {workout.exercises.map((ex) => (
            <div
              key={ex.id}
              className="bg-surface rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <ExerciseImage imageUrl={ex.exercise?.image_url} name={ex.exercise?.name} />
                <h2 className="font-semibold text-text">
                  {ex.exercise.name}
                  <span className="text-xs font-normal text-muted ml-2">
                    ({ex.exercise.equipment})
                  </span>
                </h2>
              </div>
              <div className="space-y-1">
                {ex.sets.map((set, idx) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted w-6 text-center">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-text">
                        {ex.exercise?.equipment !== "Bodyweight"
                          ? `${set.weight || 0} lbs × ${set.reps} reps`
                          : `${set.reps} reps`}
                      </p>
                    </div>
                    {set.is_pr && set.pr_type && (
                      <div className="flex items-center gap-1">
                        {set.pr_type.split(",").map((type) => (
                          <span
                            key={type}
                            className="text-xs font-medium text-amber-400 bg-amber-900/30 border border-amber-700/50 rounded px-1.5 py-0.5"
                          >
                            🏆{" "}
                            {type === "volume"
                              ? "Vol"
                              : type === "weight"
                              ? "Wt"
                              : "Reps"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
