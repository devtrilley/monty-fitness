import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useParams, useNavigate } from "react-router-dom";
import { getWorkoutSession, finishWorkout, discardWorkout } from "../utils/api";
import toast from "react-hot-toast";
import TronToaster from "../components/TronToaster";
import ExercisePicker from "../components/ExercisePicker";
import SetTypeModal from "../components/SetTypeModal";
import RestTimerModal from "../components/RestTimerModal";
import TimeEditModal from "../components/TimeEditModal";
import ConfirmModal from "../components/ConfirmModal";
import ReorderExercisesModal from "../components/ReorderExercisesModal";
import ActiveExerciseCard from "../components/ActiveExerciseCard";

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
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem(`active_workout_${sessionId}`);
    return saved ? JSON.parse(saved) : null;
  });
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
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const longPressTimer = useRef(null);
  const audioCtxRef = useRef(null);

  const handleLongPressStart = () => {
    if (session?.exercises?.length < 2) return;
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
    const reordered = Array.from(session.exercises);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSession({ ...session, exercises: reordered });
    setReorderMode(false);
  };

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
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
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {}
  };

  // Save session to localStorage on every change
  useEffect(() => {
    if (session) {
      localStorage.setItem(
        `active_workout_${sessionId}`,
        JSON.stringify(session)
      );
    }
  }, [session, sessionId]);

  // Save completedSets to localStorage
  useEffect(() => {
    localStorage.setItem(
      `active_workout_completed_${sessionId}`,
      JSON.stringify([...completedSets])
    );
  }, [completedSets, sessionId]);

  useEffect(() => {
    const fetchSession = async () => {
      // Check if we have saved data
      const savedSession = localStorage.getItem(`active_workout_${sessionId}`);
      const savedCompleted = localStorage.getItem(
        `active_workout_completed_${sessionId}`
      );

      if (savedSession) {
        setSession(JSON.parse(savedSession));
        if (savedCompleted) {
          setCompletedSets(new Set(JSON.parse(savedCompleted)));
        }
        setLoading(false);
        return;
      }

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
      // Clear localStorage
      localStorage.removeItem(`active_workout_${sessionId}`);
      localStorage.removeItem(`active_workout_completed_${sessionId}`);
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
      localStorage.removeItem(`active_workout_${sessionId}`);
      localStorage.removeItem(`active_workout_completed_${sessionId}`);
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
    <div className="min-h-screen bg-bg pb-32">
      <TronToaster />

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
            className="px-4 py-2 text-white text-sm font-bold uppercase tracking-[0.15em] transition-all active:scale-[0.97]"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid var(--color-danger)",
              color: "var(--color-danger)",
              clipPath:
                "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
              fontFamily: "monospace",
            }}
          >
            Discard
          </button>
        </div>

        {/* Stats */}
        {!statsCollapsed && !reorderMode && (
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
        {Object.keys(restTimers).length > 0 && !reorderMode && (
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
        {!reorderMode && (
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
        )}
      </div>
      {/* Challenge Progress Bar */}
      {session.challenge_id &&
        session.challenge_required_reps &&
        !reorderMode && (
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
        {session.exercises.length === 0 && !reorderMode && (
          <div
            className="p-8 text-center"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              clipPath:
                "polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)",
            }}
          >
            <div className="text-4xl mb-3">🏋️</div>
            <p
              className="text-xl font-bold text-text mb-1"
              style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
            >
              GET STARTED
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
              Add an exercise to start your workout
            </p>
            <button
              onClick={() => {
                setIsAddingExercise(true);
                setShowExercisePicker(true);
              }}
              className="w-full py-4 text-white font-bold uppercase tracking-[0.2em] text-sm active:scale-[0.98] transition-all mb-4"
              style={{
                background: "var(--color-accent)",
                color: "#000",
                clipPath:
                  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
                fontFamily: "monospace",
              }}
            >
              + Add Exercise
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleTimeEdit}
                className="flex-1 py-3 text-sm font-bold uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-muted)",
                  clipPath:
                    "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                  fontFamily: "monospace",
                }}
              >
                Settings
              </button>
              <button
                onClick={() => setShowDiscardConfirm(true)}
                className="flex-1 py-3 text-sm font-bold uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "var(--color-danger)",
                  clipPath:
                    "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                  fontFamily: "monospace",
                }}
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {reorderMode ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="active-reorder">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {session.exercises.map((ex, index) => (
                    <Draggable
                      key={`reorder-${ex.id}-${index}`}
                      draggableId={`reorder-${ex.id}-${index}`}
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
                            src={
                              ex.exercise?.image_url ||
                              "/placeholder-exercise.png"
                            }
                            alt={ex.exercise?.name}
                            className="w-10 h-10 rounded-full object-cover bg-surface-raised"
                          />
                          <span className="text-accent font-medium flex-1">
                            {ex.exercise?.name} ({ex.exercise?.equipment})
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
          session.exercises.map((ex, exIdx) => (
            <ActiveExerciseCard
              key={ex.id}
              exercise={ex}
              index={exIdx}
              completedSets={completedSets}
              onToggleSetCompletion={toggleSetCompletion}
              onUpdateSet={updateSet}
              onAddSet={(idx) => {
                const updated = { ...session };
                const lastSet =
                  updated.exercises[idx].sets[
                    updated.exercises[idx].sets.length - 1
                  ] || {};
                updated.exercises[idx].sets.push({
                  id: Date.now(),
                  set_number: updated.exercises[idx].sets.length + 1,
                  set_type: "normal",
                  weight: lastSet.weight || null,
                  reps: lastSet.reps || null,
                  rir: null,
                });
                setSession(updated);
              }}
              onReplace={(idx) => {
                setReplacingExerciseIdx(idx);
                setShowExercisePicker(true);
              }}
              onRemove={(idx) => {
                if (session.exercises.length <= 1) {
                  toast.error("Cannot remove the last exercise");
                  return;
                }
                const updated = { ...session };
                updated.exercises = updated.exercises.filter(
                  (_, i) => i !== idx
                );
                setSession(updated);
                toast.success("Exercise removed");
              }}
              onOpenRestModal={(idx) => {
                setRestTimerExerciseIdx(idx);
                setHasScrolledRestModal(false);
                setShowRestModal(true);
              }}
              onOpenSetTypeModal={(exIdx, setIdx) => {
                setEditingSet({ exIdx, setIdx });
                setShowSetTypeModal(true);
              }}
              customRestSeconds={customExerciseRest[exIdx]}
              canRemove={session.exercises.length > 1}
              onLongPressStart={handleLongPressStart}
              onLongPressEnd={handleLongPressEnd}
              onReorder={() => setReorderMode(true)}
            />
          ))
        )}

        {!reorderMode && (
          <>
            <button
              onClick={() => {
                setIsAddingExercise(true);
                setShowExercisePicker(true);
              }}
              className="w-full py-3 mt-2 font-bold text-sm uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
              style={{
                background: "var(--color-accent-subtle)",
                border: "1px solid var(--color-accent-35)",
                color: "var(--color-accent)",
                clipPath:
                  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
                fontFamily: "monospace",
              }}
            >
              + Add Exercise
            </button>

            <button
              onClick={handleFinish}
              className="w-full py-4 mt-4 active:scale-[0.98] font-bold tracking-[0.2em] uppercase text-sm transition-all"
              style={{
                background: "var(--color-accent)",
                color: "#000",
                border: "1px solid var(--color-accent-80)",
                clipPath:
                  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
                fontFamily: "monospace",
              }}
            >
              Finish Workout
            </button>
          </>
        )}

        {reorderMode && (
          <button
            onClick={() => setReorderMode(false)}
            className="w-full py-3 mt-4 font-bold text-sm uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
            style={{
              background: "var(--color-accent)",
              color: "#000",
              clipPath:
                "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              fontFamily: "monospace",
            }}
          >
            Done Reordering
          </button>
        )}
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
        <div
          className="rounded-xl p-4 mb-4 text-center"
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)",
          }}
        >
          <p
            className="text-4xl font-bold mb-1"
            style={{ color: "var(--color-warning)" }}
          >
            {challengeRepsShort}
          </p>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-warning)" }}
          >
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
      <ReorderExercisesModal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        exercises={session.exercises}
        onSave={(reordered) => {
          setSession({ ...session, exercises: reordered });
        }}
      />
    </div>
  );
}
