import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await adminLogin(email, password);
      setUser(data.user);
      navigate("/admin");
    } catch {
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: "var(--color-accent)", boxShadow: "0 0 20px var(--color-accent-60)" }}>
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <h1 className="text-2xl font-bold tracking-widest uppercase"
            style={{ color: "var(--color-text)" }}>
            Admin Access
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
            Restricted to authorized personnel
          </p>
        </div>

        <div className="rounded-2xl p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm"
                style={{ background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent-30)", color: "var(--color-accent)" }}>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                placeholder="admin@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-muted)" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-xl text-sm tracking-[0.15em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)",
                boxShadow: "0 0 20px var(--color-accent-60), 0 0 40px var(--color-accent-30)",
                border: "1px solid var(--color-accent-80)",
              }}
            >
              {loading ? "Authenticating..." : "Enter Admin Panel"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--color-muted)" }}>
          Not an admin?{" "}
          <a href="/login" className="transition-colors" style={{ color: "var(--color-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--color-accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--color-muted)"}>
            Go to app login
          </a>
        </p>
      </div>
    </div>
  );
}