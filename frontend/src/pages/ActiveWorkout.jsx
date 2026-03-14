import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";

// Shim: handles direct URL navigation / deep links / back-button hits.
// Opens the overlay and returns to the previous page.
export default function ActiveWorkout() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { openSession, sessionId: activeSessionId } = useWorkout();

  useEffect(() => {
    if (activeSessionId === String(sessionId)) {
      // Already open in overlay — just go back
      navigate(-1);
      return;
    }
    openSession(sessionId);
    navigate(-1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-muted">Loading workout...</p>
    </div>
  );
}