import { useState } from "react";
import { useWorkout } from "../context/WorkoutContext";
import ConfirmModal from "./ConfirmModal";

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function WorkoutMiniBar() {
  const { session, elapsedSeconds, setIsMinimized, discard } = useWorkout();
  const [showDiscard, setShowDiscard] = useState(false);

  const workoutName =
    session?.name || session?.routine_name || "Active Workout";
  const currentExercise = session?.exercises?.[0]?.exercise?.name || "";

  return (
    <>
      <div
        className="fixed left-0 right-0 z-[60] flex items-center gap-3 px-4"
        style={{
          bottom: "calc(64px + env(safe-area-inset-bottom))",
          height: "52px",
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-accent)",
          borderBottom: "1px solid var(--color-border)",
          boxShadow: "0 -4px 20px rgba(0,200,255,0.15)",
        }}
      >
        {/* Expand button */}
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center justify-center w-8 h-8 shrink-0 transition-colors"
          style={{
            border: "1px solid var(--color-accent-35)",
            color: "var(--color-accent)",
            clipPath:
              "polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)",
          }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>

        {/* Workout info — tapping expands */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => setIsMinimized(false)}
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.15em] truncate leading-tight"
            style={{ color: "var(--color-text)", fontFamily: "monospace" }}
          >
            {workoutName}
          </p>
          {currentExercise && (
            <p
              className="text-[10px] truncate leading-tight mt-0.5"
              style={{ color: "var(--color-muted)" }}
            >
              {currentExercise}
            </p>
          )}
        </button>

        {/* Live timer */}
        <p
          className="text-sm font-bold shrink-0 tabular-nums"
          style={{ color: "var(--color-accent)", fontFamily: "monospace" }}
        >
          {formatTime(elapsedSeconds)}
        </p>

        {/* Discard */}
        <button
          onClick={() => setShowDiscard(true)}
          className="flex items-center justify-center w-8 h-8 shrink-0"
          style={{ color: "var(--color-danger)" }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <ConfirmModal
        isOpen={showDiscard}
        onClose={() => setShowDiscard(false)}
        onConfirm={async () => {
          setShowDiscard(false);
          await discard();
        }}
        title="Discard Workout?"
        message="You will lose your progress and cannot get it back."
        confirmText="Discard"
        confirmDanger
      />
    </>
  );
}
