import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateProfile, getWorkoutHistory } from "../utils/api";
import WorkoutHistoryCard from "../components/WorkoutHistoryCard";
import TopBar from "../components/TopBar";
import ChamferButton from "../components/ChamferButton";

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [workouts, setWorkouts] = useState([]);

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

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const updatedUser = await updateProfile(
        firstName,
        lastName,
        bio,
        user?.profile_photo_url
      );
      setUser(updatedUser.user);
      setMessage("success");
    } catch {
      setMessage("error");
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
          <div
            className="w-16 h-16 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{
              borderRadius: "4px",
              background: "var(--color-accent)",
              boxShadow: "0 0 16px var(--color-accent-60)",
            }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>
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
          {message === "success" && (
            <p className="text-sm text-success mt-2">Profile updated!</p>
          )}
          {message === "error" && (
            <p className="text-sm text-danger mt-2">
              Failed to update profile.
            </p>
          )}
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
