import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CropPhotoModal from "../components/CropPhotoModal";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";
import {
  finishWorkout,
  getPresignedUrl,
  getWorkoutSession,
  uploadToS3,
} from "../utils/api";
import { toast } from "../components/TronToaster";
import TopBar from "../components/TopBar";
import ChamferButton from "../components/ChamferButton";
import TimeEditModal from "../components/TimeEditModal";

export default function SaveWorkout() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { clearSession, pauseTimer, resumeTimer, setIsMinimized } =
    useWorkout();
  const isSavingRef = useRef(false);
  const photoInputRef = useRef(null);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropMimeType, setCropMimeType] = useState("image/jpeg");
  const [showCrop, setShowCrop] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(0);

  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editMinutes, setEditMinutes] = useState(0);
  const [hasScrolledTimeEdit, setHasScrolledTimeEdit] = useState(false);

  const completedSets = useMemo(() => {
    const saved = localStorage.getItem(`active_workout_completed_${sessionId}`);
    return new Set(saved ? JSON.parse(saved) : []);
  }, [sessionId]);

  // Pause timer on mount; resume if they back out (not if they save)
  useEffect(() => {
    pauseTimer();
    return () => {
      if (!isSavingRef.current) {
        resumeTimer();
        setIsMinimized(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedSession = localStorage.getItem(
          `active_workout_${sessionId}`
        );
        const savedElapsed = localStorage.getItem(
          `active_workout_elapsed_${sessionId}`
        );

        let activeSession = null;

        if (savedSession) {
          activeSession = JSON.parse(savedSession);
        } else {
          activeSession = await getWorkoutSession(sessionId);
        }

        setSession(activeSession);
        setTitle(
          activeSession?.name || activeSession?.routine_name || "Quick Workout"
        );
        setNotes(activeSession?.notes || "");
        setPhotoUrl(activeSession?.workout_photo_url || "");

        if (savedElapsed) {
          setDurationMinutes(
            Math.max(0, Math.floor(Number(savedElapsed) / 60))
          );
        } else if (activeSession?.session_date) {
          const startedAt = new Date(activeSession.session_date).getTime();
          const elapsed = Math.max(
            0,
            Math.floor((Date.now() - startedAt) / 1000)
          );
          setDurationMinutes(Math.floor(elapsed / 60));
        }
      } catch {
        toast.error("Failed to load save screen");
        navigate(`/workouts/session/${sessionId}`);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, navigate]);

  const completedSetCount = useMemo(() => {
    return completedSets.size;
  }, [completedSets]);

  const totalVolume = useMemo(() => {
    if (!session?.exercises) return 0;

    let total = 0;

    session.exercises.forEach((ex, exIdx) => {
      ex.sets.forEach((set, setIdx) => {
        if (completedSets.has(`${exIdx}-${setIdx}`) && set.weight && set.reps) {
          total += set.weight * set.reps;
        }
      });
    });

    return total;
  }, [session, completedSets]);

  const clearActiveWorkoutStorage = () => {
    localStorage.removeItem(`active_workout_${sessionId}`);
    localStorage.removeItem(`active_workout_completed_${sessionId}`);
    localStorage.removeItem(`active_workout_elapsed_${sessionId}`);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller");
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setCropMimeType(file.type);
    setShowCrop(true);
    e.target.value = "";
  };

  const handleCropConfirm = useCallback(
    async (blob) => {
      setShowCrop(false);
      setPhotoUploading(true);

      try {
        const { presigned_url, final_url } = await getPresignedUrl(
          cropMimeType,
          "workout"
        );
        await uploadToS3(presigned_url, blob);
        setPhotoUrl(final_url);
        toast.success("Workout photo uploaded");
      } catch (err) {
        console.error(err);
        toast.error("Failed to upload workout photo");
      } finally {
        if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc(null);
        setPhotoUploading(false);
      }
    },
    [cropMimeType, cropImageSrc]
  );

  const handleCropCancel = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setShowCrop(false);
  }, [cropImageSrc]);

  const handleSaveWorkout = async () => {
    if (!session?.exercises?.length) {
      toast.error("No workout data found");
      return;
    }

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

    if (completedSetIds.length === 0) {
      toast.error("Complete at least 1 set before saving");
      return;
    }

    setSaving(true);

    try {
      await finishWorkout(sessionId, {
        name: title?.trim() || session.name || "Quick Workout",
        notes: notes?.trim() || "",
        workout_photo_url: photoUrl || null,
        duration_minutes: durationMinutes,
        completed_set_ids: completedSetIds,
        set_updates: setUpdates,
      });

      isSavingRef.current = true;
      clearSession();
      toast.success("Workout saved");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save workout");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted">Loading save screen...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-bg pb-24">
      <TopBar title="Save Workout" onBack={() => navigate(-1)} />

      <div className="px-6 py-6 space-y-5">
        <div
          className="p-5"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            clipPath:
              "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">
            Workout Title
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Workout name"
            className="w-full px-3 py-3 bg-surface-raised border border-border rounded-lg text-text text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <div className="grid grid-cols-3 gap-4 mt-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">
                Duration
              </p>
              <button
                onClick={() => {
                  setEditMinutes(durationMinutes);
                  setHasScrolledTimeEdit(false);
                  setShowTimeEdit(true);
                }}
                className="text-accent font-bold text-base"
              >
                {durationMinutes} min
              </button>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">
                Volume
              </p>
              <p className="text-text font-bold text-base">
                {totalVolume.toLocaleString()} lbs
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">
                Sets
              </p>
              <p className="text-text font-bold text-base">
                {completedSetCount}
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-5"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            clipPath:
              "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">
            Workout Notes
          </p>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="How did the workout go?"
            className="w-full px-3 py-3 bg-surface-raised border border-border rounded-lg text-text resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div
          className="p-5"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            clipPath:
              "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">
            Workout Photo
          </p>

          {photoUrl ? (
            <div className="space-y-3">
              <img
                src={photoUrl}
                alt="Workout"
                className="w-full max-h-[320px] object-cover rounded-lg border border-border"
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="w-full py-3 text-sm font-bold uppercase tracking-[0.15em]"
                style={{
                  background: "var(--color-accent-subtle)",
                  border: "1px solid var(--color-accent-35)",
                  color: "var(--color-accent)",
                  clipPath:
                    "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                }}
              >
                {photoUploading ? "Uploading..." : "Change Photo"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUploading}
              className="w-full py-8 text-sm font-bold uppercase tracking-[0.15em]"
              style={{
                border: "1px dashed var(--color-border-bright)",
                color: "var(--color-accent)",
                background: "var(--color-surface-raised)",
                clipPath:
                  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              }}
            >
              {photoUploading ? "Uploading..." : "+ Add Workout Photo"}
            </button>
          )}

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          <p className="text-xs text-muted mt-3">Max size: 5MB</p>
        </div>

        <ChamferButton
          onClick={handleSaveWorkout}
          disabled={saving || photoUploading}
        >
          {saving ? "Saving..." : "Save Workout"}
        </ChamferButton>
      </div>

      {showCrop && cropImageSrc && (
        <CropPhotoModal
          imageSrc={cropImageSrc}
          mimeType={cropMimeType}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <TimeEditModal
        isOpen={showTimeEdit}
        onClose={(newElapsedSeconds) => {
          if (newElapsedSeconds !== undefined && newElapsedSeconds !== null) {
            const newMinutes = Math.max(0, Math.floor(newElapsedSeconds / 60));
            setDurationMinutes(newMinutes);
            localStorage.setItem(
              `active_workout_elapsed_${sessionId}`,
              String(newElapsedSeconds)
            );
          }
          setShowTimeEdit(false);
        }}
        currentMinutes={editMinutes}
        onSelectMinutes={setEditMinutes}
        hasScrolled={hasScrolledTimeEdit}
        setHasScrolled={setHasScrolledTimeEdit}
      />
    </div>
  );
}
