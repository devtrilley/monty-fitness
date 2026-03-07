import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getWorkoutSession, finishWorkout, discardWorkout } from "../utils/api";
import toast, { Toaster } from "react-hot-toast";
import { getSetLabel } from "../utils/setHelpers";
import ExercisePicker from "../components/ExercisePicker";
import ExerciseImage from "../components/ExerciseImage";
import SetTypeModal from "../components/SetTypeModal";
import RestTimerModal from "../components/RestTimerModal";
import TimeEditModal from "../components/TimeEditModal";
import ConfirmModal from "../components/ConfirmModal";
import { useRef } from "react";

const formatRestTime = (seconds) => {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs}s`;
};

export default function ActiveWorkout() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedSets, setCompletedSets] = useState(new Set());
  const [restTimers, setRestTimers] = useState({});
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  const [customExerciseRest, setCustomExerciseRest] = useState({});
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editMinutes, setEditMinutes] = useState(0);
  const [hasScrolledRestModal, setHasScrolledRestModal] = useState(false);
  const [hasScrolledTimeEdit, setHasScrolledTimeEdit] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [replacingExerciseIdx, setReplacingExerciseIdx] = useState(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [showSetTypeModal, setShowSetTypeModal] = useState(false);
  const [editingSet, setEditingSet] = useState({ exIdx: null, setIdx: null });
  const [menuExerciseIdx, setMenuExerciseIdx] = useState(null);
  const [restTimerExerciseIdx, setRestTimerExerciseIdx] = useState(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showChallengeWarning, setShowChallengeWarning] = useState(false);
  const [challengeRepsShort, setChallengeRepsShort] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const audioCtxRef = useRef(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const unlockAudio = () => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();
    } catch {}
  };

  const playChime = () => {
    try {
      const audioContext = getAudioCtx();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {}
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await getWorkoutSession(sessionId);
        setSession(data);

        if (data?.session_date) {
          const t = new Date(data.session_date).getTime();
          if (!Number.isNaN(t)) setStartTime(t);
        }
      } catch {
        toast.error("Failed to load workout session");
        navigate("/workouts");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (menuExerciseIdx !== null) setMenuExerciseIdx(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuExerciseIdx]);

  useEffect(() => {
    const intervals = {};
    Object.keys(restTimers).forEach((key) => {
      if (restTimers[key] > 0) {
        intervals[key] = setInterval(() => {
          setRestTimers((prev) => {
            const newValue = prev[key] - 1;
            if (newValue <= 0) {
              playChime();
              return {};
            }
            return { ...prev, [key]: newValue };
          });
        }, 1000);
      }
    });
    return () => Object.values(intervals).forEach(clearInterval);
  }, [restTimers]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}min ${secs}s`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReplaceExercise = (newExercise) => {
    const updated = { ...session };
    updated.exercises[replacingExerciseIdx].exercise_id = newExercise.id;
    updated.exercises[replacingExerciseIdx].exercise = newExercise;
    setSession(updated);
    setShowExercisePicker(false);
    setReplacingExerciseIdx(null);
    toast.success("Exercise replaced");
  };

  const handleAddExercises = (exercises) => {
    const currentIds = session.exercises.map(
      (e) => e.exercise_id || e.exercise?.id
    );
    const newExercises = exercises.filter((ex) => !currentIds.includes(ex.id));
    if (newExercises.length === 0) {
      toast.error("All selected exercises already in workout");
      return;
    }
    const updated = { ...session };
    newExercises.forEach((ex) => {
      updated.exercises.push({
        id: Date.now() + Math.random(),
        exercise_id: ex.id,
        exercise: ex,
        rest_seconds: 120,
        notes: "",
        sets: [
          {
            id: Date.now() + Math.random(),
            set_number: 1,
            set_type: "normal",
            weight: null,
            reps: null,
            rir: null,
          },
        ],
      });
    });
    setSession(updated);
    setShowExercisePicker(false);
    setIsAddingExercise(false);
    toast.success(
      `${newExercises.length} exercise${
        newExercises.length > 1 ? "s" : ""
      } added`
    );
  };

  const calculateVolume = () => {
    if (!session) return 0;
    let total = 0;
    session.exercises.forEach((ex, exIdx) => {
      ex.sets.forEach((set, setIdx) => {
        if (completedSets.has(`${exIdx}-${setIdx}`) && set.weight && set.reps) {
          total += set.weight * set.reps;
        }
      });
    });
    return total;
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = { ...session };
    updated.exercises[exerciseIndex].sets[setIndex][field] = value;
    setSession(updated);
  };

  const toggleSetCompletion = (exIdx, setIdx, restSeconds) => {
    unlockAudio();
    const setKey = `${exIdx}-${setIdx}`;
    const newCompleted = new Set(completedSets);
    if (newCompleted.has(setKey)) {
      newCompleted.delete(setKey);
    } else {
      newCompleted.add(setKey);
      const actualRestSeconds = customExerciseRest[exIdx] || restSeconds || 120;
      if (actualRestSeconds) setRestTimers({ [exIdx]: actualRestSeconds });
    }
    setCompletedSets(newCompleted);
  };

  const handleFinish = () => {
    if (session.challenge_id && session.challenge_required_reps) {
      let completedReps = 0;
      session.exercises.forEach((ex, exIdx) => {
        ex.sets.forEach((set, setIdx) => {
          if (completedSets.has(`${exIdx}-${setIdx}`) && set.reps)
            completedReps += set.reps;
        });
      });
      if (completedReps < session.challenge_required_reps) {
        setChallengeRepsShort(session.challenge_required_reps - completedReps);
        setShowChallengeWarning(true);
        return;
      }
    }
    let incompleteSets = 0;
    session.exercises.forEach((ex, exIdx) => {
      ex.sets.forEach((_, setIdx) => {
        if (!completedSets.has(`${exIdx}-${setIdx}`)) incompleteSets++;
      });
    });
    if (incompleteSets > 0) setShowFinishConfirm(true);
    else finishWorkoutNow();
  };

  const finishWorkoutNow = async (skipChallenge = false) => {
    try {
      const completedSetIds = [];
      const setUpdates = [];
      session.exercises.forEach((ex, exIdx) => {
        ex.sets.forEach((set, setIdx) => {
          if (completedSets.has(`${exIdx}-${setIdx}`)) {
            completedSetIds.push(set.id);
            setUpdates.push({
              id: set.id,
              weight: set.weight ?? null,
              reps: set.reps ?? null,
              rir: set.rir ?? null,
              set_type: set.set_type || "normal",
            });
          }
        });
      });
      await finishWorkout(sessionId, {
        duration_minutes: Math.floor(elapsedSeconds / 60),
        completed_set_ids: completedSetIds,
        set_updates: setUpdates,
        skip_challenge_complete: skipChallenge,
      });
      toast.success("Workout completed!");
      const params = new URLSearchParams(window.location.search);
      navigate(
        params.get("from") === "challenge" ? "/challenges" : "/dashboard"
      );
    } catch {
      toast.error("Failed to finish workout");
    }
  };

  const handleDiscardConfirm = async () => {
    try {
      await discardWorkout(sessionId);
      toast.success("Workout discarded");
      navigate("/workouts");
    } catch {
      toast.error("Failed to discard workout");
    } finally {
      setShowDiscardConfirm(false);
    }
  };

  const handleTimeEdit = () => {
    setEditMinutes(Math.floor(elapsedSeconds / 60));
    setHasScrolledTimeEdit(false);
    setShowTimeEdit(true);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted">Loading workout...</p>
      </div>
    );

  if (!session) return null;

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Toaster position="top-center" />

      {/* Sticky Header + Stats */}
      <div className="bg-surface sticky top-0 z-10 border-b border-border shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="text-muted hover:text-text transition-colors text-xl"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold text-text">Active Workout</h1>
          <button
            onClick={() => setShowDiscardConfirm(true)}
            className="px-4 py-2 bg-danger hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Discard
          </button>
        </div>

        {/* Stats */}
        {!statsCollapsed && (
          <div className="px-6 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide">
                  Duration
                </p>
                <button
                  onClick={handleTimeEdit}
                  className="text-base font-bold text-accent hover:text-accent-hover transition-colors"
                >
                  {formatTime(elapsedSeconds)}
                </button>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide">
                  Volume
                </p>
                <p className="text-base font-bold text-text">
                  {calculateVolume()} lbs
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide">
                  Sets
                </p>
                <p className="text-base font-bold text-text">
                  {completedSets.size}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rest Timer */}
        {Object.keys(restTimers).length > 0 && (
          <div className="px-6 py-2 border-b border-border">
            <div className="flex items-center justify-between gap-2 bg-accent-subtle rounded-lg p-2">
              <button
                onClick={() => setRestTimers({})}
                className="px-3 py-1 bg-accent text-white rounded-md font-medium text-sm"
              >
                Skip
              </button>
              <div className="flex-1 text-center">
                <p className="text-sm text-accent font-medium">
                  Rest: {formatRestTime(Object.values(restTimers)[0])}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const key = Object.keys(restTimers)[0];
                    setRestTimers((prev) => {
                      const v = prev[key] - 15;
                      if (v <= 0) {
                        playChime();
                        return {};
                      }
                      return { ...prev, [key]: v };
                    });
                  }}
                  className="px-3 py-1 bg-surface-raised text-text rounded-md font-medium text-sm"
                >
                  -15
                </button>
                <button
                  onClick={() => {
                    const key = Object.keys(restTimers)[0];
                    setRestTimers((prev) => ({
                      ...prev,
                      [key]: prev[key] + 15,
                    }));
                  }}
                  className="px-3 py-1 bg-surface-raised text-text rounded-md font-medium text-sm"
                >
                  +15
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setStatsCollapsed(!statsCollapsed)}
          className="w-full py-1.5 flex justify-center hover:bg-surface-raised transition-colors"
        >
          <svg
            className={`w-4 h-4 text-muted transition-transform ${
              statsCollapsed ? "" : "rotate-180"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Challenge Progress Bar */}
      {session.challenge_id && session.challenge_required_reps && (
        <div className="px-6 py-3 bg-surface border-b border-border">
          {(() => {
            let completedReps = 0;
            session.exercises.forEach((ex, exIdx) => {
              ex.sets.forEach((set, setIdx) => {
                if (completedSets.has(`${exIdx}-${setIdx}`) && set.reps)
                  completedReps += set.reps;
              });
            });
            const required = session.challenge_required_reps;
            const pct = Math.min((completedReps / required) * 100, 100);
            const done = completedReps >= required;
            return (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-xs font-medium text-muted uppercase tracking-wide">
                    Challenge Progress
                  </p>
                  <p
                    className={`text-xs font-bold ${
                      done ? "text-success" : "text-accent"
                    }`}
                  >
                    {completedReps} / {required} reps {done ? "✓" : ""}
                  </p>
                </div>
                <div className="w-full bg-surface-raised rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      done ? "bg-success" : "bg-accent"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Exercises */}
      <div className="px-6 py-6 space-y-6">
        {session.exercises.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🏋️</div>
            <p className="text-xl font-semibold text-text mb-1">Get started</p>
            <p className="text-sm text-muted mb-6">
              Add an exercise to start your workout
            </p>

            <button
              onClick={() => {
                setIsAddingExercise(true);
                setShowExercisePicker(true);
              }}
              className="w-full py-4 bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-semibold rounded-xl transition-all"
            >
              + Add Exercise
            </button>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleTimeEdit}
                className="flex-1 py-3 bg-surface-raised border border-border text-text font-medium rounded-xl hover:bg-surface transition-colors"
              >
                Settings
              </button>
              <button
                onClick={() => setShowDiscardConfirm(true)}
                className="flex-1 py-3 bg-surface-raised border border-border text-danger font-medium rounded-xl hover:bg-surface transition-colors"
              >
                Discard Workout
              </button>
            </div>
          </div>
        )}

        {session.exercises.map((ex, exIdx) => {
          const showWeight = ex.exercise?.equipment !== "Bodyweight";
          return (
            <div
              key={ex.id}
              className="bg-surface rounded-xl border border-border p-4"
            >
              <div className="mb-2">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ExerciseImage imageUrl={ex.exercise?.image_url} name={ex.exercise?.name} />
                    <h3 className="font-semibold text-text">
                      {ex.exercise.name}
                      <span className="text-xs font-normal text-muted ml-1">
                        ({ex.exercise.equipment})
                      </span>
                    </h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuExerciseIdx(
                        exIdx === menuExerciseIdx ? null : exIdx
                      );
                    }}
                    className="p-2 text-muted hover:text-text text-xl font-bold transition-colors"
                  >
                    ⋮
                  </button>
                </div>

                {/* Exercise Menu */}
                {menuExerciseIdx === exIdx && (
                  <div className="absolute right-8 bg-surface border border-border rounded-lg shadow-lg py-2 z-20 w-56">
                    <button
                      onClick={() => {
                        setReplacingExerciseIdx(exIdx);
                        setShowExercisePicker(true);
                        setMenuExerciseIdx(null);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-raised flex items-center gap-3"
                    >
                      🔄 Replace Exercise
                    </button>
                    <button
                      onClick={() => {
                        if (session.exercises.length <= 1) {
                          toast.error("Cannot remove the last exercise");
                          setMenuExerciseIdx(null);
                          return;
                        }
                        const updated = { ...session };
                        updated.exercises = updated.exercises.filter(
                          (_, i) => i !== exIdx
                        );
                        setSession(updated);
                        setMenuExerciseIdx(null);
                        toast.success("Exercise removed");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-raised flex items-center gap-3"
                    >
                      ✕ Remove Exercise
                    </button>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRestTimerExerciseIdx(exIdx);
                    setHasScrolledRestModal(false);
                    setShowRestModal(true);
                  }}
                  className="flex items-center gap-1 text-sm text-accent mt-2 mb-2 hover:text-accent-hover transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatRestTime(
                    customExerciseRest[exIdx] || ex.rest_seconds || 120
                  )}
                </button>
              </div>

              <textarea
                placeholder="Add notes..."
                rows={2}
                className="w-full text-sm text-text mb-3 px-2 py-1 border border-border bg-surface-raised rounded focus:outline-none focus:border-accent resize-none max-h-24 placeholder:text-muted"
              />

              {/* Sets Table */}
              <div className="space-y-2">
                <div
                  className={`grid ${
                    showWeight
                      ? "grid-cols-[35px_64px_62px_62px_42px]"
                      : "grid-cols-[35px_62px_62px_42px]"
                  } gap-1.5 text-[10px] font-medium text-muted uppercase`}
                >
                  <div className="text-center">SET</div>
                  {showWeight && <div className="text-center">LBS</div>}
                  <div className="text-center">REPS</div>
                  <div className="text-center">RIR</div>
                  <div className="text-center">✓</div>
                </div>

                {ex.sets.map((set, setIdx) => {
                  const setKey = `${exIdx}-${setIdx}`;
                  const isCompleted = completedSets.has(setKey);
                  return (
                    <div
                      key={set.id}
                      className={`grid ${
                        showWeight
                          ? "grid-cols-[35px_64px_62px_62px_42px]"
                          : "grid-cols-[35px_62px_62px_42px]"
                      } gap-1.5 items-center rounded-md -mx-4 px-4 py-1 transition-colors ${
                        isCompleted
                          ? "bg-green-900/40"
                          : setIdx % 2 === 0
                          ? "bg-surface-raised"
                          : "bg-surface"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setEditingSet({ exIdx, setIdx });
                          setShowSetTypeModal(true);
                        }}
                        disabled={isCompleted}
                        className={`font-medium text-center h-9 w-9 rounded-lg transition-colors ${
                          set.set_type === "warmup"
                            ? "bg-yellow-900/40 text-yellow-400"
                            : set.set_type === "failure"
                            ? "bg-red-900/40 text-red-400"
                            : set.set_type === "drop"
                            ? "bg-blue-900/40 text-blue-400"
                            : "bg-surface-raised text-text"
                        } ${
                          isCompleted
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:opacity-80"
                        }`}
                      >
                        {getSetLabel(ex.sets, setIdx)}
                      </button>

                      {(() => {
                        const lastSet = ex.last_performance?.[setIdx];
                        return (
                          <>
                            {showWeight && (
                              <input
                                type="number"
                                value={set.weight ?? ""}
                                min="0"
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateSet(
                                    exIdx,
                                    setIdx,
                                    "weight",
                                    v === "" ? null : Math.max(0, parseFloat(v))
                                  );
                                }}
                                onWheel={(e) => e.target.blur()}
                                disabled={isCompleted}
                                placeholder={
                                  lastSet?.weight ? String(lastSet.weight) : "—"
                                }
                                className="h-9 px-1 border border-border bg-surface-raised text-text rounded-lg text-xs text-center placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            )}
                            <input
                              type="number"
                              value={set.reps ?? ""}
                              min="0"
                              onChange={(e) => {
                                const v = e.target.value;
                                updateSet(
                                  exIdx,
                                  setIdx,
                                  "reps",
                                  v === "" ? null : Math.max(0, parseInt(v))
                                );
                              }}
                              onWheel={(e) => e.target.blur()}
                              disabled={isCompleted}
                              placeholder={
                                lastSet?.reps ? String(lastSet.reps) : "—"
                              }
                              className="h-9 px-2 border border-border bg-surface-raised text-text rounded-lg text-sm text-center placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </>
                        );
                      })()}

                      <input
                        type="number"
                        value={set.rir ?? ""}
                        min="0"
                        max="10"
                        onChange={(e) => {
                          const v = e.target.value;
                          updateSet(
                            exIdx,
                            setIdx,
                            "rir",
                            v === "" ? null : Math.max(0, parseInt(v))
                          );
                        }}
                        onWheel={(e) => e.target.blur()}
                        disabled={isCompleted}
                        placeholder="—"
                        className="h-9 px-2 border border-border bg-surface-raised text-text rounded-lg text-sm text-center placeholder:text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                      />

                      <button
                        onClick={() =>
                          toggleSetCompletion(
                            exIdx,
                            setIdx,
                            ex.rest_seconds || 120
                          )
                        }
                        className={`h-9 w-9 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          isCompleted
                            ? "bg-accent border-accent text-white"
                            : "border-border hover:border-accent text-muted"
                        }`}
                      >
                        {isCompleted && "✓"}
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    const updated = { ...session };
                    const lastSet = ex.sets[ex.sets.length - 1] || {};
                    updated.exercises[exIdx].sets.push({
                      id: Date.now(),
                      set_number: ex.sets.length + 1,
                      set_type: "normal",
                      weight: lastSet.weight || null,
                      reps: lastSet.reps || null,
                      rir: null,
                    });
                    setSession(updated);
                  }}
                  className="w-full py-2 mt-2 text-sm text-accent hover:text-accent-hover border border-dashed border-accent/40 rounded-lg transition-colors"
                >
                  + Add Set
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => {
            setIsAddingExercise(true);
            setShowExercisePicker(true);
          }}
          className="w-full py-3 mt-2 text-accent font-medium border-2 border-dashed border-accent/40 rounded-xl hover:bg-accent-subtle transition-colors"
        >
          + Add Exercise
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 pb-safe">
        <button
          onClick={handleFinish}
          className="w-full py-3 bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-medium rounded-xl transition-colors"
        >
          Finish Workout
        </button>
      </div>

      <RestTimerModal
        isOpen={showRestModal && restTimerExerciseIdx !== null}
        onClose={() => {
          setShowRestModal(false);
          setRestTimerExerciseIdx(null);
        }}
        exerciseName={session?.exercises[restTimerExerciseIdx]?.exercise.name}
        currentRest={
          customExerciseRest[restTimerExerciseIdx] ||
          session?.exercises[restTimerExerciseIdx]?.rest_seconds ||
          120
        }
        onSelectRest={(seconds) =>
          setCustomExerciseRest((prev) => ({
            ...prev,
            [restTimerExerciseIdx]: seconds,
          }))
        }
        hasScrolled={hasScrolledRestModal}
        setHasScrolled={setHasScrolledRestModal}
      />

      <ConfirmModal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleDiscardConfirm}
        title="Discard Workout?"
        message="You will lose your progress and cannot get it back."
        confirmText="Discard"
        confirmDanger
      />

      <ConfirmModal
        isOpen={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        onConfirm={() => {
          setShowFinishConfirm(false);
          finishWorkoutNow();
        }}
        title="Finish Workout?"
        message={`You have ${session.exercises.reduce(
          (total, ex, exIdx) =>
            total +
            ex.sets.filter(
              (_, setIdx) => !completedSets.has(`${exIdx}-${setIdx}`)
            ).length,
          0
        )} uncompleted set(s).`}
        subMessage="Only completed sets will be counted in your workout history."
        cancelText="Keep Training"
        confirmText="Finish Anyway"
      />

      <TimeEditModal
        isOpen={showTimeEdit}
        onClose={(newElapsedSeconds) => {
          if (newElapsedSeconds !== undefined && newElapsedSeconds !== null) {
            setStartTime(Date.now() - newElapsedSeconds * 1000);
            setElapsedSeconds(newElapsedSeconds);
          }
          setShowTimeEdit(false);
        }}
        currentMinutes={editMinutes}
        onSelectMinutes={setEditMinutes}
        hasScrolled={hasScrolledTimeEdit}
        setHasScrolled={setHasScrolledTimeEdit}
      />

      <SetTypeModal
        isOpen={showSetTypeModal}
        onClose={() => {
          setShowSetTypeModal(false);
          setEditingSet({ exIdx: null, setIdx: null });
        }}
        currentSet={
          session?.exercises[editingSet.exIdx]?.sets[editingSet.setIdx]
        }
        allSets={session?.exercises[editingSet.exIdx]?.sets || []}
        setIndex={editingSet.setIdx}
        onSelectType={(type) => {
          const updated = { ...session };
          updated.exercises[editingSet.exIdx].sets[editingSet.setIdx].set_type =
            type;
          setSession(updated);
          setShowSetTypeModal(false);
          setEditingSet({ exIdx: null, setIdx: null });
        }}
        onDelete={() => {
          const updated = { ...session };
          updated.exercises[editingSet.exIdx].sets = updated.exercises[
            editingSet.exIdx
          ].sets.filter((_, i) => i !== editingSet.setIdx);
          setSession(updated);
          setShowSetTypeModal(false);
          setEditingSet({ exIdx: null, setIdx: null });
          toast.success("Set deleted");
        }}
        canDelete={
          session?.exercises[editingSet.exIdx]?.sets.length > 1 &&
          !completedSets.has(`${editingSet.exIdx}-${editingSet.setIdx}`)
        }
      />

      <ConfirmModal
        isOpen={showChallengeWarning}
        onClose={() => setShowChallengeWarning(false)}
        onConfirm={() => {
          setShowChallengeWarning(false);
          finishWorkoutNow(true);
        }}
        title="Challenge Not Complete"
        cancelText="Keep Going"
        confirmText="Finish Anyway"
      >
        <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl p-4 mb-4 text-center">
          <p className="text-4xl font-bold text-orange-400 mb-1">
            {challengeRepsShort}
          </p>
          <p className="text-sm font-medium text-orange-300">
            rep{challengeRepsShort !== 1 ? "s" : ""} still needed
          </p>
        </div>
        <p className="text-sm text-muted mb-4 text-center">
          Finishing now won't count toward your challenge progress.
        </p>
      </ConfirmModal>

      {showExercisePicker && (
        <ExercisePicker
          isOpen={showExercisePicker}
          onClose={() => {
            setShowExercisePicker(false);
            setReplacingExerciseIdx(null);
            setIsAddingExercise(false);
          }}
          onSelectExercise={handleReplaceExercise}
          onSelectExercises={handleAddExercises}
          multiSelect={isAddingExercise}
          alreadyAdded={session.exercises.map(
            (e) => e.exercise_id || e.exercise?.id
          )}
        />
      )}
    </div>
  );
}
