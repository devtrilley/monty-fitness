import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getExerciseHistory } from "../utils/api";
import TopBar from "../components/TopBar";
import ExerciseImage from "../components/ExerciseImage";
import { Trophy, Dumbbell, RotateCcw } from "lucide-react";

const chamfer = (size = 10) =>
  `polygon(${size}px 0%, 100% 0%, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0% 100%, 0% ${size}px)`;

function ExerciseHistorySkeleton({ onBack }) {
  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopBar title="Exercise History" onBack={onBack} />
      <div className="px-4 py-6 animate-pulse space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 bg-surface rounded" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-surface rounded" />
            <div className="h-3 w-24 bg-surface rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-surface border border-border rounded" />)}
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="bg-surface border border-border rounded p-4 space-y-2">
            <div className="h-3 w-32 bg-surface-raised rounded" />
            {[1,2,3].map(j => <div key={j} className="h-7 bg-surface-raised rounded" />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExerciseHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExerciseHistory(id)
      .then(setData)
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ExerciseHistorySkeleton onBack={() => navigate(-1)} />;
  if (!data) return null;

  const { exercise, history, prs } = data;
  const isBodyweight = exercise.equipment === "Bodyweight";

  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopBar title="Exercise History" onBack={() => navigate(-1)} />
      <div className="px-4 py-6 space-y-4">
        {/* Exercise header */}
        <div className="flex items-center gap-3">
          <ExerciseImage imageUrl={exercise.image_url} name={exercise.name} size="lg" />
          <div>
            <h1 className="text-lg font-bold text-text">{exercise.name}</h1>
            <p className="text-xs text-muted">{exercise.equipment} · {exercise.primary_muscle}</p>
          </div>
        </div>

        {/* PRs */}
        {(prs.best_weight || prs.best_reps) && (
          <div
            className="p-4"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-accent-30)",
              clipPath: chamfer(10),
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={13} style={{ color: "var(--color-accent)" }} />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent" style={{ fontFamily: "monospace" }}>
                Personal Records
              </p>
            </div>
            <div className={`grid gap-3 ${isBodyweight ? "grid-cols-1" : "grid-cols-3"}`}>
              {!isBodyweight && prs.best_weight && (
                <div
                  className="p-3 text-center"
                  style={{ background: "var(--color-accent-subtle)", clipPath: chamfer(6) }}
                >
                  <p className="text-xs text-muted mb-1" style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.2em" }}>BEST WT</p>
                  <p className="text-xl font-black text-accent">{prs.best_weight}</p>
                  <p className="text-xs text-muted">lbs</p>
                </div>
              )}
              {prs.best_reps && (
                <div
                  className="p-3 text-center"
                  style={{ background: "var(--color-accent-subtle)", clipPath: chamfer(6) }}
                >
                  <p className="text-xs text-muted mb-1" style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.2em" }}>BEST REPS</p>
                  <p className="text-xl font-black text-accent">{prs.best_reps}</p>
                  <p className="text-xs text-muted">reps</p>
                </div>
              )}
              {!isBodyweight && prs.best_volume && (
                <div
                  className="p-3 text-center"
                  style={{ background: "var(--color-accent-subtle)", clipPath: chamfer(6) }}
                >
                  <p className="text-xs text-muted mb-1" style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.2em" }}>BEST VOL</p>
                  <p className="text-xl font-black text-accent">{(prs.best_volume / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-muted">lbs</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History */}
        <div className="flex items-center gap-2 mb-1">
          <RotateCcw size={13} style={{ color: "var(--color-muted)" }} />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted" style={{ fontFamily: "monospace" }}>
            History ({history.length} sessions)
          </p>
        </div>

        {history.length === 0 ? (
          <div
            className="p-8 text-center"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              clipPath: chamfer(10),
            }}
          >
            <Dumbbell size={28} className="mx-auto mb-3" style={{ color: "var(--color-border-bright)" }} />
            <p className="text-sm text-muted">No history yet — complete a workout with this exercise.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((session) => (
              <div
                key={session.session_id}
                className="p-4"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  clipPath: chamfer(8),
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-text" style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}>
                    {session.session_name}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(session.session_date).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {session.sets.map((set, i) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between py-1 border-b border-border last:border-0"
                    >
                      <span className="text-xs text-muted w-6">{i + 1}</span>
                      <span className="text-sm text-text flex-1">
                        {isBodyweight
                          ? `${set.reps ?? "—"} reps`
                          : `${set.weight || 0} lbs × ${set.reps ?? "—"} reps`}
                      </span>
                      {set.is_pr && (
                        <span
                          className="text-[10px] px-1.5 py-0.5"
                          style={{
                            color: "var(--color-accent)",
                            background: "var(--color-accent-subtle)",
                            border: "1px solid var(--color-accent-30)",
                            fontFamily: "monospace",
                          }}
                        >
                          PR
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}