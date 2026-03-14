import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  updateProfile,
  getWorkoutHistory,
  getPresignedUrl,
  uploadToS3,
} from "../utils/api";
import WorkoutHistoryCard from "../components/WorkoutHistoryCard";
import TopBar from "../components/TopBar";
import ChamferButton from "../components/ChamferButton";
import { toast } from "../components/TronToaster";

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [displayNamePref, setDisplayNamePref] = useState(
    user?.display_name_preference || "username"
  );
  const [saving, setSaving] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);

  const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const data = await getWorkoutHistory();
        setWorkouts(data.workouts || []);
      } catch {
        console.error("Failed to fetch workout history");
      }
    };
    fetchWorkouts();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Use JPG, PNG, or WEBP.");
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      toast.error("Profile photo must be 5 MB or smaller.");
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
      return;
    }

    setPhotoUploading(true);

    try {
      const { presigned_url, final_url } = await getPresignedUrl(
        file.type,
        "profile"
      );

      await uploadToS3(presigned_url, file);

      const updatedUser = await updateProfile(
        firstName,
        lastName,
        bio,
        final_url
      );

      setUser(updatedUser.user);
      toast.success("Profile photo updated.");
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error("Could not update profile photo.");
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updatedUser = await updateProfile(
        firstName,
        lastName,
        bio,
        user?.profile_photo_url,
        displayNamePref
      );
      setUser(updatedUser.user);
      toast.success("Profile updated.");
    } catch (err) {
      console.error("Profile save error:", err);
      toast.error("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopBar title="Profile" />
      <div className="px-6 py-6 space-y-4">
        {/* Avatar + Info */}
        <div
          className="p-5 flex items-center gap-4"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            clipPath:
              "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
          }}
        >
          <button
            onClick={() => photoInputRef.current?.click()}
            className="relative w-16 h-16 flex-shrink-0"
            style={{ borderRadius: "4px" }}
          >
            {user?.profile_photo_url ? (
              <img
                src={user.profile_photo_url}
                alt="Profile"
                className="w-16 h-16 object-cover"
                style={{
                  borderRadius: "4px",
                  boxShadow: "0 0 16px var(--color-accent-60)",
                }}
              />
            ) : (
              <div
                className="w-16 h-16 flex items-center justify-center text-black text-2xl font-bold"
                style={{
                  borderRadius: "4px",
                  background: "var(--color-accent)",
                  boxShadow: "0 0 16px var(--color-accent-60)",
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center"
              style={{
                background: "rgba(0,0,0,0.55)",
                clipPath:
                  "polygon(3px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%, 0% 3px)",
              }}
            >
              {photoUploading ? (
                <span className="text-black text-[9px] font-bold">…</span>
              ) : (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </button>
          <div>
            <p className="font-semibold text-text text-lg">
              {user?.first_name || user?.last_name
                ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
                : user?.username}
            </p>
            <p className="text-sm text-muted">@{user?.username}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div
          className="p-5"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            clipPath:
              "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
          }}
        >
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                First Name
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Last Name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                placeholder="Last name"
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-muted mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none transition-all"
            placeholder="Tell us about yourself..."
          />
          <div className="mt-4 mb-1">
            <label className="block text-sm font-medium text-muted mb-2">
              Display name
            </label>
            <div className="flex gap-3">
              {[
                { val: "username", label: "Username" },
                { val: "first_name", label: "First Name" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDisplayNamePref(val)}
                  className="flex-1 py-2 text-sm font-bold tracking-[0.12em] uppercase transition-all active:scale-[0.98]"
                  style={{
                    clipPath:
                      "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
                    background:
                      displayNamePref === val
                        ? "var(--color-accent)"
                        : "transparent",
                    color:
                      displayNamePref === val ? "#000" : "var(--color-muted)",
                    border:
                      displayNamePref === val
                        ? "none"
                        : "1px solid var(--color-border)",
                    fontFamily: "monospace",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-1.5">
              This is how the app will refer to you.
            </p>
          </div>
          <ChamferButton
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="mt-3"
          >
            {saving ? "Saving..." : "Save Changes"}
          </ChamferButton>
        </div>

        {/* Quick Links */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            clipPath:
              "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => navigate("/analytics")}
            className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
            style={{ borderBottom: "1px solid var(--color-border)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-surface-raised)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span className="font-medium text-text">📊 Analytics</span>
            <span className="text-muted">›</span>
          </button>
          <button
            onClick={() => navigate("/challenges")}
            className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-surface-raised)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span className="font-medium text-text">🏆 Challenges</span>
            <span className="text-muted">›</span>
          </button>
        </div>

        {/* Recent Workouts */}
        <div>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            Recent Activity
          </h2>
          {workouts.length > 0 ? (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <WorkoutHistoryCard key={workout.id} workout={workout} />
              ))}
            </div>
          ) : (
            <div
              className="p-6 text-center"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                clipPath:
                  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              }}
            >
              <p className="text-muted text-sm">No workouts yet</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 font-bold uppercase tracking-[0.15em] text-sm transition-all active:scale-[0.98]"
          style={{
            fontFamily: "monospace",
            border: "1px solid var(--color-danger)",
            color: "var(--color-danger)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--color-danger)15")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
