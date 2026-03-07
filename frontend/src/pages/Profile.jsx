import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateProfile, getWorkoutHistory } from "../utils/api";
import WorkoutHistoryCard from "../components/WorkoutHistoryCard";
import TopBar from "../components/TopBar";

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
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
      const updatedUser = await updateProfile(bio, user?.profile_photo_url);
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
        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-text text-lg">{user?.username}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-surface rounded-xl border border-border p-5">
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
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-3 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Quick Links */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => navigate("/analytics")}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-raised border-b border-border transition-colors"
          >
            <span className="font-medium text-text">📊 Analytics</span>
            <span className="text-muted">›</span>
          </button>
          <button
            onClick={() => navigate("/challenges")}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-raised transition-colors"
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
            <div className="bg-surface rounded-xl border border-border p-6 text-center">
              <p className="text-muted text-sm">No workouts yet</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 border border-danger/30 text-danger font-medium rounded-xl hover:bg-red-900/20 transition-colors"
        >
          Log Out
        </button>
      </div>
      </div>
  );
}
