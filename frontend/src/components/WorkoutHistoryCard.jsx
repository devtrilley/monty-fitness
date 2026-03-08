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
      className="cursor-pointer transition-all active:scale-[0.99]"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        clipPath: "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h3 className="font-bold text-base text-text mb-1">{workout.name}</h3>
        <p style={{ color: "var(--color-muted)", fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.15em" }}>
          {formatFullDateTime(workout.session_date)}
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-3 gap-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <p style={{ color: "var(--color-muted)", fontFamily: "monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3px" }}>Time</p>
          <p className="text-sm font-bold text-text">{workout.duration_minutes || 0}min</p>
        </div>
        <div>
          <p style={{ color: "var(--color-muted)", fontFamily: "monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3px" }}>Volume</p>
          <p className="text-sm font-bold text-text">
            {workout.total_volume ? `${workout.total_volume.toLocaleString()} lbs` : "—"}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--color-muted)", fontFamily: "monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3px" }}>PRs</p>
          <p className="text-sm font-bold" style={{ color: workout.pr_count > 0 ? "var(--color-accent)" : "var(--color-text)" }}>
            🏆 {workout.pr_count || 0}
          </p>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-4 py-3 space-y-2">
        {workout.exercises?.slice(0, 3).map((ex, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {ex.exercise?.image_url ? (
              <div className="w-7 h-7 flex-shrink-0 overflow-hidden bg-surface-raised" style={{ clipPath: "polygon(3px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%, 0% 3px)" }}>
                <img src={ex.exercise.image_url} alt={ex.exercise.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            ) : (
              <span style={{ color: "var(--color-accent)" }}>—</span>
            )}
            <span className="text-text">{ex.exercise.name}</span>
            <span style={{ color: "var(--color-muted)", fontSize: "11px" }}>
              {ex.sets.filter((s) => s.weight && s.reps).length} sets
            </span>
          </div>
        ))}
        {workout.exercises?.length > 3 && (
          <p style={{ color: "var(--color-accent)", fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.1em", marginTop: "4px" }}>
            +{workout.exercises.length - 3} more exercises
          </p>
        )}
      </div>
    </div>
  );
}
