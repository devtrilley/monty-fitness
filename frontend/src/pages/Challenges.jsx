import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import ChamferButton from "../components/ChamferButton";

import {
  getChallenges,
  getChallengeProgress,
  joinChallenge,
  startChallengeDay,
} from "../utils/api";
import toast from "react-hot-toast";

function ChallengesSkeleton() {
  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopBar title="Challenges" />
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface rounded-xl border border-border overflow-hidden"
          >
            <div className="w-full h-40 bg-surface-raised" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-surface-raised rounded" />
              <div className="h-3 w-full bg-surface-raised rounded" />
              <div className="h-3 w-2/3 bg-surface-raised rounded" />
              <div className="h-1.5 w-full bg-surface-raised rounded-full mt-2" />
              <div className="h-10 bg-surface-raised rounded-lg mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [ch, prog] = await Promise.all([
          getChallenges(),
          getChallengeProgress(),
        ]);
        const progMap = {};
        prog.forEach((p) => {
          progMap[p.challenge_id] = p;
        });
        setChallenges(ch);
        setProgress(progMap);
      } catch {
        toast.error("Failed to load challenges");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleJoin = async (id) => {
    try {
      await joinChallenge(id);
      const updated = await getChallengeProgress();
      const progMap = {};
      updated.forEach((p) => {
        progMap[p.challenge_id] = p;
      });
      setProgress(progMap);
      toast.success("Challenge joined!");
    } catch {
      toast.error("Failed to join challenge");
    }
  };

  const handleStartDay = async (challenge) => {
    setStarting(challenge.id);
    try {
      const data = await startChallengeDay(challenge.id);
      navigate(`/workouts/session/${data.session.id}?from=challenge`);
    } catch (err) {
      toast.error(
        err?.response?.data?.error || "Failed to start challenge workout"
      );
    } finally {
      setStarting(null);
    }
  };

  if (loading) return <ChallengesSkeleton />;

  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopBar title="Challenges" />
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.length === 0 && (
          <div
            className="col-span-full p-10 text-center"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              clipPath:
                "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
            }}
          >
            <p className="text-3xl mb-3">🏆</p>
            <p className="font-semibold text-text mb-1">No challenges yet</p>
            <p className="text-sm text-muted">Check back soon.</p>
          </div>
        )}
        {challenges.map((ch) => {
          const p = progress[ch.id];
          const joined = !!p;
          const percent = joined
            ? Math.min((p.day_index / ch.days_required) * 100, 100)
            : 0;
          const completed = joined && p.completed;
          const currentDay = p ? p.day_index + 1 : 1;

          return (
            <div
              key={ch.id}
              className="flex flex-col"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                clipPath:
                  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
                overflow: "hidden",
              }}
            >
              {ch.image_url && (
                <img
                  src={ch.image_url}
                  alt={ch.name}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-text text-lg mb-1">
                  {ch.name}
                </h3>
                <p className="text-muted text-sm mb-4 flex-1">
                  {ch.description}
                </p>

                <div
                  className="w-full rounded-full h-1.5 mb-3"
                  style={{ background: "var(--color-surface-raised)" }}
                >
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${percent}%`,
                      background: completed
                        ? "var(--color-success)"
                        : joined
                        ? "var(--color-accent)"
                        : "var(--color-border)",
                      boxShadow:
                        joined && !completed
                          ? "0 0 6px var(--color-accent-60)"
                          : "none",
                    }}
                  />
                </div>
                

                {joined && !completed && (
                  <p className="text-xs text-muted mb-3">
                    {p.day_index === 0
                      ? `0 / ${ch.days_required} days`
                      : `${p.day_index} / ${ch.days_required} days completed`}
                  </p>
                )}
                {completed && (
                  <p className="text-sm text-success mb-3 font-medium">
                    ✅ Completed!
                  </p>
                )}

                <div className="mt-auto">
                  {!joined ? (
                    <ChamferButton onClick={() => handleJoin(ch.id)} size="sm">
                      Join Challenge
                    </ChamferButton>
                  ) : !completed ? (
                    <ChamferButton
                      onClick={() => handleStartDay(ch)}
                      disabled={starting === ch.id}
                      size="sm"
                    >
                      {starting === ch.id
                        ? "Starting..."
                        : `Start Day ${currentDay}`}
                    </ChamferButton>
                  ) : (
                    <ChamferButton disabled size="sm" variant="secondary">
                      Completed
                    </ChamferButton>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
