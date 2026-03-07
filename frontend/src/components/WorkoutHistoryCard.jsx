import { useNavigate } from "react-router-dom";

export default function WorkoutHistoryCard({ workout }) {
  const navigate = useNavigate();

  const formatFullDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      onClick={() => navigate(`/workouts/history/${workout.id}`)}
      className="bg-surface rounded-xl border border-border p-4 cursor-pointer hover:bg-surface-raised transition-colors"
    >
      <h3 className="font-semibold text-text mb-1">{workout.name}</h3>
      <p className="text-xs text-muted mb-3">
        {formatFullDateTime(workout.session_date)}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-0.5">
            Time
          </p>
          <p className="text-sm font-semibold text-text">
            {workout.duration_minutes || 0}min
          </p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-0.5">
            Volume
          </p>
          <p className="text-sm font-semibold text-text">
            {workout.total_volume
              ? `${workout.total_volume.toLocaleString()} lbs`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-0.5">
            PRs
          </p>
          <p className="text-sm font-semibold text-text">
            🏆 {workout.pr_count || 0}
          </p>
        </div>
      </div>

      <div className="space-y-1 border-t border-border pt-3">
      {workout.exercises?.slice(0, 3).map((ex, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {ex.exercise?.image_url ? (
              <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 bg-surface-raised">
                <img
                  src={ex.exercise.image_url}
                  alt={ex.exercise.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            ) : (
              <span className="text-muted">•</span>
            )}
            <span className="text-text">{ex.exercise.name}</span>
            <span className="text-muted text-xs">
              {ex.sets.filter((s) => s.weight && s.reps).length} sets
            </span>
          </div>
        ))}
        {workout.exercises?.length > 3 && (
          <p className="text-xs text-muted mt-1">
            +{workout.exercises.length - 3} more exercises
          </p>
        )}
      </div>
    </div>
  );
}
