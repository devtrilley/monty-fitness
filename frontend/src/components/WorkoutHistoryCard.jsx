import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function WorkoutHistoryCard({ workout }) {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = useState(0);
  const hasPhoto = Boolean(workout.workout_photo_url);
  const hasNotes = Boolean(workout.notes?.trim());

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

  const goToSlide = (index, e) => {
    e.stopPropagation();
    setSlideIndex(index);
  };

  const handleTouchStart = (e) => {
    if (!hasPhoto) return;
    e.currentTarget.dataset.touchStartX = String(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!hasPhoto) return;

    const touchStartX = Number(e.currentTarget.dataset.touchStartX || 0);
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) < 40) return;

    if (diff > 0) {
      setSlideIndex(1);
    } else {
      setSlideIndex(0);
    }
  };

  const renderHeader = () => (
    <div
      className="px-4 pt-4 pb-3"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <h3 className="font-bold text-base text-text mb-1">{workout.name}</h3>
      <p
        style={{
          color: "var(--color-muted)",
          fontFamily: "monospace",
          fontSize: "10px",
          letterSpacing: "0.15em",
        }}
      >
        {formatFullDateTime(workout.session_date)}
      </p>
    </div>
  );

  const renderStats = () => (
    <div
      className="px-4 py-3 grid grid-cols-3 gap-4"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <div>
        <p
          style={{
            color: "var(--color-muted)",
            fontFamily: "monospace",
            fontSize: "8px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "3px",
          }}
        >
          Time
        </p>
        <p className="text-sm font-bold text-text">
          {workout.duration_minutes || 0}min
        </p>
      </div>
      <div>
        <p
          style={{
            color: "var(--color-muted)",
            fontFamily: "monospace",
            fontSize: "8px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "3px",
          }}
        >
          Volume
        </p>
        <p className="text-sm font-bold text-text">
          {workout.total_volume
            ? `${workout.total_volume.toLocaleString()} lbs`
            : "—"}
        </p>
      </div>
      {workout.pr_count > 0 && (
        <div>
          <p
            style={{
              color: "var(--color-muted)",
              fontFamily: "monospace",
              fontSize: "8px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "3px",
            }}
          >
            PRs
          </p>
          <p
            className="text-sm font-bold"
            style={{ color: "var(--color-accent)" }}
          >
            🏆 {workout.pr_count}
          </p>
        </div>
      )}
    </div>
  );

  const renderNotes = () => {
    if (!hasNotes) return null;

    return (
      <div
        className="px-4 py-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <p
          className="text-sm leading-6"
          style={{
            color: "var(--color-text)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "72px",
          }}
        >
          {workout.notes}
        </p>
      </div>
    );
  };

  const renderExercises = () => (
    <div className="px-4 py-3 space-y-2">
      {workout.exercises?.slice(0, 3).map((ex, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          {ex.exercise?.image_url ? (
            <div
              className="w-7 h-7 flex-shrink-0 overflow-hidden bg-surface-raised"
              style={{
                clipPath:
                  "polygon(3px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%, 0% 3px)",
              }}
            >
              <img
                src={ex.exercise.image_url}
                alt={ex.exercise.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
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
        <p
          style={{
            color: "var(--color-accent)",
            fontFamily: "monospace",
            fontSize: "10px",
            letterSpacing: "0.1em",
            marginTop: "4px",
          }}
        >
          +{workout.exercises.length - 3} more exercises
        </p>
      )}
    </div>
  );

  const renderWorkoutContent = () => (
    <div className="min-h-[260px] flex flex-col">
      {renderHeader()}
      {renderStats()}
      <div className="flex-1 flex flex-col">
        {renderNotes()}
        {renderExercises()}
      </div>
    </div>
  );

  const renderPhotoSlide = () => (
    <div className="min-h-[260px] flex flex-col">
      {renderHeader()}
      {renderStats()}
      <div className="flex-1 px-4 pt-4 pb-0">
        <img
          src={workout.workout_photo_url}
          alt={workout.name}
          className="w-full h-full min-h-[260px] object-cover"
          style={{
            border: "1px solid var(--color-border)",
            borderBottom: "none",
            clipPath:
              "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      onClick={() => navigate(`/workouts/history/${workout.id}`)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="cursor-pointer transition-all active:scale-[0.99] overflow-hidden"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        clipPath:
          "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
      }}
    >
      {hasPhoto ? (
        <>
          <div className="min-h-[520px]">
            {slideIndex === 0 ? renderPhotoSlide() : renderWorkoutContent()}
          </div>

          <div
            className="flex items-center justify-center gap-2 py-3"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <button
              onClick={(e) => goToSlide(0, e)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background:
                  slideIndex === 0
                    ? "var(--color-accent)"
                    : "var(--color-border-bright)",
                boxShadow:
                  slideIndex === 0 ? "0 0 8px var(--color-accent-60)" : "none",
              }}
            />
            <button
              onClick={(e) => goToSlide(1, e)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background:
                  slideIndex === 1
                    ? "var(--color-accent)"
                    : "var(--color-border-bright)",
                boxShadow:
                  slideIndex === 1 ? "0 0 8px var(--color-accent-60)" : "none",
              }}
            />
          </div>
        </>
      ) : (
        renderWorkoutContent()
      )}
    </div>
  );
}
