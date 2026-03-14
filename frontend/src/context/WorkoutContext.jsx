import { createContext, useContext, useState, useEffect } from "react";
import { getWorkoutSession, discardWorkout } from "../utils/api";
import toast from "react-hot-toast";

const WorkoutContext = createContext(null);

export const useWorkout = () => {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkout must be used within WorkoutProvider");
  return ctx;
};

export const WorkoutProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [session, setSession] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedSets, setCompletedSets] = useState(new Set());
  const [restTimers, setRestTimers] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOpen = !!sessionId;

  // Live timer — stops when paused
  useEffect(() => {
    if (!startTime || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isPaused]);

  // Persist to localStorage
  useEffect(() => {
    if (session && sessionId) {
      localStorage.setItem(
        `active_workout_${sessionId}`,
        JSON.stringify(session)
      );
    }
  }, [session, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(
      `active_workout_completed_${sessionId}`,
      JSON.stringify([...completedSets])
    );
  }, [completedSets, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(
      `active_workout_elapsed_${sessionId}`,
      String(elapsedSeconds)
    );
  }, [elapsedSeconds, sessionId]);

  const openSession = async (newSessionId) => {
    const id = String(newSessionId);
    setSessionId(id);
    setLoading(true);
    setIsMinimized(false);
    setIsPaused(false);
    setRestTimers({});

    try {
      const savedSession = localStorage.getItem(`active_workout_${id}`);
      const savedCompleted = localStorage.getItem(
        `active_workout_completed_${id}`
      );
      const savedElapsed = localStorage.getItem(`active_workout_elapsed_${id}`);

      let activeSession;
      if (savedSession) {
        activeSession = JSON.parse(savedSession);
      } else {
        activeSession = await getWorkoutSession(id);
      }

      setSession(activeSession);
      setCompletedSets(
        savedCompleted ? new Set(JSON.parse(savedCompleted)) : new Set()
      );

      if (savedElapsed) {
        const elapsed = Number(savedElapsed);
        setElapsedSeconds(elapsed);
        setStartTime(Date.now() - elapsed * 1000);
      } else {
        // Fresh session — always start at 0
        setElapsedSeconds(0);
        setStartTime(Date.now());
      }
    } catch {
      toast.error("Failed to load workout session");
      setSessionId(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Freeze the clock — call on SaveWorkout mount
  const pauseTimer = () => {
    setIsPaused(true);
  };

  // Resume from where it left off — call when backing out of SaveWorkout
  const resumeTimer = () => {
    setStartTime(Date.now() - elapsedSeconds * 1000);
    setIsPaused(false);
  };

  const clearSession = () => {
    if (sessionId) {
      localStorage.removeItem(`active_workout_${sessionId}`);
      localStorage.removeItem(`active_workout_completed_${sessionId}`);
      localStorage.removeItem(`active_workout_elapsed_${sessionId}`);
    }
    setSessionId(null);
    setSession(null);
    setStartTime(null);
    setElapsedSeconds(0);
    setCompletedSets(new Set());
    setRestTimers({});
    setIsMinimized(false);
    setIsPaused(false);
    setLoading(false);
  };

  const discard = async () => {
    try {
      await discardWorkout(sessionId);
      clearSession();
      toast.success("Workout discarded");
      return true;
    } catch {
      toast.error("Failed to discard workout");
      return false;
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        sessionId,
        session,
        setSession,
        startTime,
        setStartTime,
        elapsedSeconds,
        setElapsedSeconds,
        completedSets,
        setCompletedSets,
        restTimers,
        setRestTimers,
        isOpen,
        isMinimized,
        setIsMinimized,
        isPaused,
        pauseTimer,
        resumeTimer,
        loading,
        openSession,
        clearSession,
        discard,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};
