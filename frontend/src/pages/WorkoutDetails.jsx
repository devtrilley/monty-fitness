import { useParams, useNavigate } from "react-router-dom";
import {
  getCompletedWorkout,
  getPresignedUrl,
  uploadToS3,
  saveWorkoutPhoto,
} from "../utils/api";
import { useEffect, useState, useRef } from "react";
import TopBar from "../components/TopBar";
import ExerciseImage from "../components/ExerciseImage";
import { toast } from "../components/TronToaster";

export default function WorkoutDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const photoInputRef = useRef(null);

  const MAX_PHOTO_SIZE_MB = 5;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      toast.error(`Workout photo must be ${MAX_PHOTO_SIZE_MB}MB or less.`);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
      return;
    }

    setPhotoUploading(true);

    try {
      const { presigned_url, final_url } = await getPresignedUrl(
        file.type,
        "workout"
      );

      await uploadToS3(presigned_url, file);
      await saveWorkoutPhoto(workout.id, final_url);

      setWorkout((prev) => ({ ...prev, workout_photo_url: final_url }));
      toast.success("Workout photo updated.");
    } catch (err) {
      console.error("Workout photo upload error:", err);
      toast.error("Failed to upload workout photo.");
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    getCompletedWorkout(id).then((data) => setWorkout(data));
  }, [id]);

  if (!workout)
    return (
      <div className="min-h-screen bg-bg pb-20">
        <TopBar title="Workout Details" onBack={() => navigate(-1)} />
        <div className="px-4 py-6 animate-pulse space-y-4">
          <div className="h-6 w-48 bg-surface rounded" />
          <div className="h-3 w-36 bg-surface rounded" />
          <div className="h-36 bg-surface border border-border rounded" />
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 bg-surface border border-border rounded space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-raised rounded" />
                <div className="h-4 w-32 bg-surface-raised rounded" />
              </div>
              <div className="h-3 w-full bg-surface-raised rounded" />
              <div className="h-3 w-3/4 bg-surface-raised rounded" />
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopBar title="Workout Details" onBack={() => navigate(-1)} />
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-text mb-1">{workout.name}</h1>
        <p className="text-sm text-muted mb-6">
          {new Date(workout.session_date).toLocaleDateString()} &nbsp;·&nbsp;
          {workout.duration_minutes || 0} min &nbsp;·&nbsp;
          {workout.completed_sets || 0} sets
        </p>

        {workout.notes && (
          <div
            className="mb-6 p-4"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              clipPath:
                "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.15em] text-muted mb-2">
              Workout Notes
            </p>
            <p className="text-sm text-text whitespace-pre-wrap">
              {workout.notes}
            </p>
          </div>
        )}

        {/* Workout Photo */}
        <div className="mb-6">
          {workout.workout_photo_url ? (
            <div className="relative">
              <button onClick={() => setLightboxOpen(true)} className="w-full">
                <img
                  src={workout.workout_photo_url}
                  alt="Workout"
                  className="w-full object-cover"
                  style={{
                    maxHeight: "280px",
                    clipPath:
                      "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
                  }}
                />
              </button>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-2 right-2 px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{
                  background: "rgba(0,0,0,0.7)",
                  color: "var(--color-accent)",
                  border: "1px solid var(--color-accent-40)",
                  clipPath:
                    "polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)",
                }}
              >
                {photoUploading ? "..." : "Change"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUploading}
              className="w-full py-4 text-sm font-bold uppercase tracking-[0.15em] transition-all"
              style={{
                border: "1px dashed var(--color-border-bright)",
                color: "var(--color-accent)",
                fontFamily: "monospace",
                clipPath:
                  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              }}
            >
              {photoUploading ? "Uploading..." : "+ Add Workout Photo"}
            </button>
          )}
          <p
            className="mt-2 text-center"
            style={{
              color: "var(--color-muted)",
              fontFamily: "monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
            }}
          >
            JPG, PNG, WEBP, GIF • MAX 5MB
          </p>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        {lightboxOpen && workout.workout_photo_url && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.95)" }}
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={workout.workout_photo_url}
              alt="Workout"
              className="max-w-[95vw] max-h-[85vh] object-contain"
              style={{
                clipPath:
                  "polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)",
              }}
            />
            <p
              className="absolute bottom-8 text-center w-full"
              style={{
                color: "var(--color-muted)",
                fontFamily: "monospace",
                fontSize: "11px",
                letterSpacing: "0.2em",
              }}
            >
              TAP TO CLOSE
            </p>
          </div>
        )}

        <div className="space-y-3">
          {workout.exercises.map((ex) => (
            <div
              key={ex.id}
              className="p-4"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                clipPath:
                  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <ExerciseImage
                  imageUrl={ex.exercise?.image_url}
                  name={ex.exercise?.name}
                />
                <h2 className="font-semibold text-text">
                  {ex.exercise.name}
                  <span className="text-xs font-normal text-muted ml-2">
                    ({ex.exercise.equipment})
                  </span>
                </h2>
              </div>
              <div className="space-y-1">
                {ex.sets.map((set, idx) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted w-6 text-center">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-text">
                        {ex.exercise?.equipment !== "Bodyweight"
                          ? `${set.weight || 0} lbs × ${set.reps ?? "—"} reps`
                          : `${set.reps ?? "—"} reps`}
                      </p>
                    </div>
                    {set.is_pr && set.pr_type && (
                      <div className="flex items-center gap-1">
                        {set.pr_type.split(",").map((type) => (
                          <span
                            key={type}
                            className="text-xs font-medium rounded px-1.5 py-0.5"
                            style={{
                              color: "var(--color-accent)",
                              background: "var(--color-accent-subtle)",
                              border: "1px solid var(--color-accent-40)",
                              textShadow: "0 0 6px var(--color-accent-60)",
                            }}
                          >
                            🏆{" "}
                            {type === "volume"
                              ? "Vol"
                              : type === "weight"
                              ? "Wt"
                              : "Reps"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
