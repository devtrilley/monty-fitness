import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import ChamferButton from "../components/ChamferButton";
import { toast } from "../components/TronToaster";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, ok } = await login(email, password);
      if (ok) {
        setUser(data.user);
        await new Promise((resolve) => setTimeout(resolve, 0));
        navigate("/dashboard");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* App Bar */}
      <div
        className="px-6 py-4"
        style={{
          background: "var(--color-bg)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="max-w-md mx-auto flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{
              background: "var(--color-accent)",
              boxShadow: "0 0 10px var(--color-accent-60)",
            }}
          >
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span
            className="text-lg font-bold tracking-[0.2em] uppercase"
            style={{
              color: "var(--color-accent)",
              textShadow: "0 0 12px var(--color-accent-60)",
            }}
          >
            Monty
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-text mb-2">Welcome back</h1>
            <p className="text-muted text-sm">
              Log in to continue your training
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-muted mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-surface-raised border border-border rounded-xl text-base text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-muted mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-surface-raised border border-border rounded-xl text-base text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <ChamferButton
              type="submit"
              disabled={loading}
              className="mt-2"
            >
              {loading ? "Logging in..." : "Log In"}
            </ChamferButton>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted text-sm">
              New to Monty?{" "}
              <Link
                to="/register"
                className="text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
