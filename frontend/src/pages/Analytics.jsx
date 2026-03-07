import { useState, useEffect, useCallback } from "react";
import VolumeChart from "../components/VolumeChart";
import TopBar from "../components/TopBar";
import {
  getAnalyticsSummary,
  getAnalyticsVolume,
  getPersonalRecords,
} from "../utils/api";
import ExerciseImage from "../components/ExerciseImage";

function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopBar title="Analytics" />
      <div className="px-6 py-6 space-y-4 animate-pulse">
        {/* This week */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <div className="h-2.5 w-16 bg-surface-raised rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2.5 w-14 bg-surface-raised rounded" />
                <div className="h-7 w-16 bg-surface-raised rounded" />
              </div>
            ))}
          </div>
        </div>
        {/* Progress */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <div className="h-2.5 w-16 bg-surface-raised rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-3.5 w-32 bg-surface-raised rounded" />
              <div className="h-3.5 w-16 bg-surface-raised rounded" />
            </div>
          ))}
        </div>
        {/* Chart */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <div className="flex justify-between">
            <div className="h-2.5 w-24 bg-surface-raised rounded" />
            <div className="h-7 w-28 bg-surface-raised rounded-lg" />
          </div>
          <div className="h-48 bg-surface-raised rounded-lg" />
        </div>
        {/* PRs */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div className="h-2.5 w-28 bg-surface-raised rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="space-y-1.5 border-b border-border pb-3 last:border-0"
            >
              <div className="h-4 w-44 bg-surface-raised rounded" />
              <div className="h-3 w-32 bg-surface-raised rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [prs, setPrs] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [timeRange, setTimeRange] = useState("3months");
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, volumeD, prsData] = await Promise.all([
        getAnalyticsSummary(),
        getAnalyticsVolume(timeRange),
        getPersonalRecords(),
      ]);
      setSummary(summaryData);
      setVolumeData(volumeD);
      setPrs(prsData);
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) return <AnalyticsSkeleton />;

  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopBar title="Analytics" onRefresh={fetchAnalytics} />
      <div className="px-6 py-6 space-y-4">
        {/* This Week */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            This Week
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Workouts", summary.this_week.workouts],
              [
                "Volume",
                summary.this_week.volume
                  ? `${summary.this_week.volume.toLocaleString()} lbs`
                  : "—",
              ],
              ["Sets", summary.this_week.sets],
              ["Duration", `${summary.this_week.duration} min`],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-muted mb-1">{label}</p>
                <p className="text-2xl font-bold text-text">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Streaks */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            Progress
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-text">🔥 Daily Streak</span>
              <span className="font-bold text-text">
                {summary.daily_streak} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text">📆 Weekly Streak</span>
              <span className="font-bold text-text">
                {summary.current_weekly_streak} weeks
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm">Best weekly streak</span>
              <span className="text-muted text-sm">
                {summary.best_weekly_streak} weeks
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm">Total workouts</span>
              <span className="text-muted text-sm">
                {summary.total_workouts}
              </span>
            </div>
            {summary.badge && (
              <div className="mt-2 inline-flex items-center gap-2 bg-accent-subtle border border-accent/20 px-3 py-1.5 rounded-lg">
                <span>🏅</span>
                <span className="text-sm font-medium text-accent">
                  {summary.badge}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Volume Chart */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">
              Volume Trends
            </h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border border-border bg-surface-raised text-text rounded-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="3months">Last 3 Months</option>
              <option value="1year">Last Year</option>
              <option value="alltime">All Time</option>
            </select>
          </div>
          <VolumeChart data={volumeData} />
        </div>

        {/* PRs */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            Personal Records
          </h2>
          <div className="space-y-3">
            {prs.slice(0, 10).map((pr) => (
              <div
                key={pr.exercise_id}
                className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <ExerciseImage
                  imageUrl={pr.image_url}
                  name={pr.exercise_name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate">
                    {pr.exercise_name}
                    <span className="text-xs font-normal text-muted ml-2">
                      ({pr.equipment})
                    </span>
                  </p>
                  {pr.equipment === "Bodyweight" ? (
                    <p className="text-sm text-muted mt-0.5">
                      🏆 {pr.best_reps} reps
                    </p>
                  ) : (
                    <p className="text-sm text-muted mt-0.5">
                      🏋️ {pr.best_weight} lbs × {pr.best_reps} reps
                      <span className="ml-1 text-xs">
                        · {pr.best_volume.toLocaleString()} vol
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
            {prs.length === 0 && (
              <p className="text-sm text-muted text-center py-6">
                No PRs yet — finish a workout to start tracking.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
