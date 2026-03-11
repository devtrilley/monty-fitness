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

const chamfer = (size = 10) =>
  `polygon(${size}px 0%, 100% 0%, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0% 100%, 0% ${size}px)`;

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState("");

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

  useEffect(() => {
    if (!loaded || !user?.username) return;
    const greetings = [
      "WELCOME BACK",
      "LET'S GET TO WORK",
      "TIME TO TRAIN",
      "STAY THE COURSE",
      "NO DAYS OFF",
    ];
    const chosen = greetings[Math.floor(Math.random() * greetings.length)];
    const target = `${chosen}, ${user.username.toUpperCase()}!`;
    let i = 0;
    setTypedText("");
    const interval = setInterval(() => {
      i++;
      setTypedText(target.slice(0, i));
      if (i >= target.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [loaded, user?.username]);

  if (!loaded) return <DashboardSkeleton />;

  const totalVolume = summary?.total_volume ?? 0;
  const volumeDisplay =
    totalVolume >= 1000
      ? `${(totalVolume / 1000).toFixed(1)}K`
      : totalVolume.toString();
  const weekWorkouts = summary?.this_week?.workouts ?? 0;
  const totalPRs = summary?.total_prs ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <TopBar title="MONTY" />
      <div className="px-5 pt-5 pb-28">
        {/* User readout */}
        <div className="flex items-center gap-2 mb-5">
          <span
            style={{
              color: "var(--color-accent)",
              fontFamily: "monospace",
              fontSize: "10px",
              letterSpacing: "0.25em",
            }}
          >
            //
          </span>
          <span
            style={{
              color: "var(--color-muted)",
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {typedText}
            <span
              style={{
                display: "inline-block",
                width: "1px",
                height: "11px",
                background: "var(--color-accent)",
                marginLeft: "2px",
                verticalAlign: "middle",
                opacity:
                  typedText.length ===
                  `WELCOME BACK, ${user?.username?.toUpperCase()}`.length
                    ? 0
                    : 1,
              }}
            />
          </span>
          <span
            style={{
              color: "var(--color-surface-raised)",
              fontFamily: "monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginLeft: "auto",
            }}
          >
            SYS.OK
          </span>
        </div>

        {/* Asymmetric stats */}
        <div className="flex gap-3 mb-5">
          {/* Hero stat */}
          <div
            className="flex-1 px-4 py-4"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              clipPath: chamfer(12),
            }}
          >
            <p
              style={{
                color: "var(--color-muted)",
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Total Volume
            </p>
            <p
              className="font-black tracking-tight leading-none"
              style={{
                color: "var(--color-text)",
                fontSize: "2.5rem",
                marginBottom: "4px",
              }}
            >
              {volumeDisplay}
            </p>
            <p
              style={{
                color: "var(--color-muted)",
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              lbs lifted
            </p>
          </div>

          {/* Secondary stats */}
          <div className="flex flex-col gap-3 w-28">
            <div
              className="flex-1 px-3 py-3"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                clipPath: chamfer(8),
              }}
            >
              <p
                style={{
                  color: "var(--color-muted)",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "2px",
                }}
              >
                This Week
              </p>
              <p
                className="font-black leading-none"
                style={{ color: "var(--color-text)", fontSize: "1.5rem" }}
              >
                {weekWorkouts}
              </p>
              <p
                style={{
                  color: "var(--color-muted)",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginTop: "2px",
                }}
              >
                sessions
              </p>
            </div>
            <div
              className="flex-1 px-3 py-3"
              style={{
                background: "var(--color-surface)",
                border: `1px solid ${
                  totalPRs > 0
                    ? "var(--color-accent-40)"
                    : "var(--color-border)"
                }`,
                clipPath: chamfer(8),
              }}
            >
              <p
                style={{
                  color: "var(--color-muted)",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "2px",
                }}
              >
                PRs
              </p>
              <p
                className="font-black leading-none"
                style={{
                  color:
                    totalPRs > 0 ? "var(--color-accent)" : "var(--color-text)",
                  fontSize: "1.5rem",
                }}
              >
                {totalPRs}
              </p>
              <p
                style={{
                  color: "var(--color-muted)",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginTop: "2px",
                }}
              >
                all time
              </p>
            </div>
          </div>
        </div>

        {/* Streak */}
        {summary?.current_weekly_streak > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 mb-5"
            style={{
              background: "var(--color-surface)",
              borderLeft: "2px solid var(--color-accent)",
              borderTop: "1px solid var(--color-border)",
              borderRight: "1px solid var(--color-border)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span className="text-base">🔥</span>
            <p
              style={{
                color: "var(--color-text)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {summary.current_weekly_streak} week streak
            </p>
            {summary.badge && (
              <span
                style={{
                  marginLeft: "auto",
                  color: "var(--color-accent)",
                  border: "1px solid var(--color-accent-30)",
                  background: "var(--color-accent-subtle)",
                  fontFamily: "monospace",
                  fontSize: "9px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  clipPath: chamfer(4),
                }}
              >
                {summary.badge}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div
          className="mb-5"
          style={{ height: "1px", background: "var(--color-border)" }}
        />

        {/* CTAs */}
        <button
          onClick={() => navigate("/workouts")}
          className="w-full py-4 font-bold text-sm uppercase mb-3 transition-all active:scale-[0.98]"
          style={{
            background: "var(--color-accent)",
            color: "#000",
            clipPath: chamfer(10),
            letterSpacing: "0.2em",
          }}
        >
          Start Workout
        </button>
        <button
          onClick={() => navigate("/analytics")}
          className="w-full py-3 mb-8 text-sm uppercase font-medium transition-all flex items-center justify-center gap-2 active:opacity-70"
          style={{
            background: "transparent",
            color: "var(--color-muted)",
            border: "1px solid var(--color-border)",
            clipPath: chamfer(8),
            letterSpacing: "0.15em",
          }}
        >
          <BarChart3 size={14} />
          View Analytics
        </button>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span
              style={{
                color: "var(--color-accent)",
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.3em",
              }}
            >
              //
            </span>
            <h2
              style={{
                color: "var(--color-muted)",
                fontFamily: "monospace",
                fontSize: "10px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Recent Activity
            </h2>
            <div
              className="flex-1"
              style={{ height: "1px", background: "var(--color-border)" }}
            />
          </div>
          {history.length === 0 ? (
            <div
              className="p-8 text-center"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                clipPath: chamfer(10),
              }}
            >
              <p className="text-3xl mb-3">🏔️</p>
              <p
                style={{
                  color: "var(--color-text)",
                  fontSize: "12px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                No sessions logged
              </p>
              <p style={{ color: "var(--color-muted)", fontSize: "12px" }}>
                Your history will appear here.
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
