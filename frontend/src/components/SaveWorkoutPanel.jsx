import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";
import CropPhotoModal from "./CropPhotoModal";
import TimeEditModal from "./TimeEditModal";
import ChamferButton from "./ChamferButton";
import { finishWorkout, getPresignedUrl, uploadToS3 } from "../utils/api";
import { toast } from "./TronToaster";
import TopBar from "./TopBar";

export default function SaveWorkoutPanel({ onBack }) {
  const navigate = useNavigate();
  const { sessionId, session, completedSets, elapsedSeconds, clearSession } =
    useWorkout();

  const photoInputRef = useRef(null);
  const isSavingRef = useRef(false);

  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [title, setTitle] = useState(
    session?.name || session?.routine_name || "Quick Workout"
  );
  const [notes, setNotes] = useState(session?.notes || "");
  const [photoUrl, setPhotoUrl] = useState(session?.workout_photo_url || "");
  const [durationMinutes, setDurationMinutes] = useState(
    Math.max(0, Math.floor(elapsedSeconds / 60))
  );

  const [showCrop, setShowCrop] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropMimeType, setCropMimeType] = useState("image/jpeg");

  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editMinutes, setEditMinutes] = useState(0);
  const [hasScrolledTimeEdit, setHasScrolledTimeEdit] = useState(false);

  // Scroll to top when save panel mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const completedSetCount = completedSets.size;

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

    // Threshold: real DB IDs are small ints; fake IDs from Date.now() are > 1e12
    const isRealId = (id) => id && id < 1e12;

    let totalCompleted = 0;
    const exercises = [];

    session.exercises.forEach((ex, exIdx) => {
      const completedSetsForEx = [];

      ex.sets.forEach((set, setIdx) => {
        if (!completedSets.has(`${exIdx}-${setIdx}`)) return;
        totalCompleted++;
        completedSetsForEx.push({
          workout_set_id: isRealId(set.id) ? set.id : null,
          weight: set.weight ?? null,
          reps: set.reps ?? null,
          rir: set.rir ?? null,
          set_type: set.set_type || "normal",
        });
      });

      if (completedSetsForEx.length === 0) return;

      exercises.push({
        workout_exercise_id: isRealId(ex.id) ? ex.id : null,
        exercise_id: ex.exercise_id || ex.exercise?.id,
        sets: completedSetsForEx,
      });
    });

    if (totalCompleted === 0) {
      toast.error("Complete at least 1 set before saving");
      return;
    }

    setSaving(true);
    let saved = false;
    try {
      await finishWorkout(sessionId, {
        name: title?.trim() || session.name || "Quick Workout",
        notes: notes?.trim() || "",
        workout_photo_url: photoUrl || null,
        duration_minutes: durationMinutes,
        exercises,
      });
      saved = true;
      // Navigate first, then clear — avoids setState on unmounting component
      document.body.style.overflow = "";
      navigate("/dashboard", { state: { refresh: Date.now() } });
      setTimeout(() => clearSession(), 50);
      toast.success("Workout saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save workout");
    } finally {
      // Only re-enable button on failure — on success the component unmounts
      if (!saved) setSaving(false);
    }
  };

  return (
    <div className="min-h-full pb-24">
      <TopBar title="Save Workout" onBack={onBack} />

      <div className="px-6 py-6 space-y-5">
        {/* Title + stats */}
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

        {/* Notes */}
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

        {/* Photo */}
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
