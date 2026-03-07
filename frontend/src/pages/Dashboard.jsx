import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getWorkoutHistory, getAnalyticsSummary } from "../utils/api";
import WorkoutHistoryCard from "../components/WorkoutHistoryCard";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { BarChart3 } from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-bg">
      <TopBar title="Hey..." />
      <div className="px-6 py-6 pb-24 animate-pulse">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface rounded-xl border border-border p-4 space-y-2"
            >
              <div className="h-2.5 w-14 bg-surface-raised rounded" />
              <div className="h-7 w-10 bg-surface-raised rounded" />
              <div className="h-2.5 w-16 bg-surface-raised rounded" />
            </div>
          ))}
        </div>
        {/* Streak bar */}
        <div className="bg-surface rounded-xl border border-border px-4 py-3 mb-6 h-16" />
        {/* CTA buttons */}
        <div className="h-14 bg-surface-raised rounded-xl mb-2" />
        <div className="h-10 bg-surface rounded-xl border border-border mb-8" />
        {/* Recent activity */}
        <div className="h-3 w-28 bg-surface rounded mb-4" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl p-4 mb-3 space-y-2"
          >
            <div className="h-4 w-2/3 bg-surface-raised rounded" />
            <div className="h-3 w-1/2 bg-surface-raised rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAll() {
      try {
        const [historyData, summaryData] = await Promise.all([
          getWorkoutHistory(5),
          getAnalyticsSummary(),
        ]);
        setHistory(historyData.workouts || []);
        setSummary(summaryData);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoaded(true);
      }
    }
    fetchAll();
  }, []);

  if (!loaded) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-bg">
      <TopBar title={`Hey, ${user?.username || ""}!`} />
      <div className="px-6 py-6 pb-24">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              This Week
            </p>
            <p className="text-2xl font-bold text-text">
              {summary?.this_week?.workouts ?? 0}
            </p>
            <p className="text-xs text-muted mt-0.5">workouts</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              Volume
            </p>
            <p className="text-2xl font-bold text-text">
              {summary?.total_volume
                ? `${(summary.total_volume / 1000).toFixed(1)}k`
                : "0"}
            </p>
            <p className="text-xs text-muted mt-0.5">lbs all time</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              PRs
            </p>
            <p className="text-2xl font-bold text-accent">
              {summary?.total_prs ?? 0}
            </p>
            <p className="text-xs text-muted mt-0.5">all time</p>
          </div>
        </div>

        {/* Streak Bar */}
        {summary?.current_weekly_streak > 0 && (
          <div className="bg-accent-subtle border border-accent/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-sm font-semibold text-text">
                {summary.current_weekly_streak} week streak
              </p>
              <p className="text-xs text-muted">Keep it going</p>
            </div>
            {summary.badge && (
              <span className="ml-auto text-xs font-medium text-accent bg-accent-subtle border border-accent/20 px-2 py-1 rounded-lg">
                {summary.badge}
              </span>
            )}
          </div>
        )}

        {/* CTAs */}
        <button
          onClick={() => navigate("/workouts")}
          className="w-full py-4 bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-semibold rounded-xl transition-all mb-2 text-base tracking-wide"
        >
          Start Workout
        </button>
        <button
          onClick={() => navigate("/analytics")}
          className="w-full py-2.5 mb-8 bg-surface border border-border text-muted hover:text-text hover:bg-surface-raised rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <BarChart3 size={15} />
          View Analytics
        </button>

        {/* Recent Activity */}
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
            Recent Activity
          </h2>
          {history.length === 0 ? (
            <div className="bg-surface p-8 rounded-xl border border-border text-center">
              <p className="text-3xl mb-3">🏔️</p>
              <p className="font-semibold text-text mb-1">No workouts yet</p>
              <p className="text-sm text-muted">
                Your history will appear here after your first session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((workout) => (
                <WorkoutHistoryCard key={workout.id} workout={workout} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
