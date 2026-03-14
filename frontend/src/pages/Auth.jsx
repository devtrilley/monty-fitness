import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, register } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import ChamferButton from "../components/ChamferButton";
import { toast } from "../components/TronToaster";

export default function Auth() {
  const location = useLocation();
  const initialMode =
    new URLSearchParams(location.search).get("mode") === "register"
      ? "register"
      : "login";

  const [mode, setMode] = useState(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayNamePref, setDisplayNamePref] = useState("username");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    setLoading(false);
  }, [mode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, ok } = await login(identifier, password);
      if (ok) {
        setUser(data.user);
        await new Promise((r) => setTimeout(r, 0));
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, ok } = await register(
        firstName,
        lastName,
        username,
        email,
        password,
        displayNamePref
      );
      if (ok) {
        setUser(data.user);
        navigate("/dashboard");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-surface-raised border border-border rounded-xl text-base text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all";

  const labelClass = "block text-sm font-medium text-muted mb-2";

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
        <div className="max-w-md mx-auto flex items-center gap-3">
          <img
            src="/monty-logo.svg"
            alt="Monty Fitness logo"
            className="h-8 w-auto shrink-0"
            style={{
              filter: "drop-shadow(0 0 10px var(--color-accent-60))",
            }}
          />
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
      <div className="flex-1 overflow-y-auto px-6 pt-16 pb-10">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <img
              src="/monty-logo-with-text.svg"
              alt="Monty Fitness logo"
              className="w-full max-w-[180px] h-auto"
              style={{
                filter: "drop-shadow(0 0 14px var(--color-accent-40))",
              }}
            />
          </div>

          {/* Mode Toggle */}
          <div
            className="relative flex mb-8 overflow-hidden"
            style={{
              clipPath:
                "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)",
              border: "1px solid var(--color-accent)",
            }}
          >
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="relative flex-1 py-3 text-sm font-bold tracking-[0.2em] uppercase cursor-pointer z-10"
                style={{
                  background: mode === m ? "var(--color-accent)" : "#000",
                  color: mode === m ? "#000" : "var(--color-accent)",
                  transition: "background 0.25s ease, color 0.25s ease",
                }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div
            key={mode}
            style={{
              animation: "authFadeIn 0.2s ease-out",
            }}
          >
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="identifier" className={labelClass}>
                    Email or Username
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={inputClass}
                    placeholder="you@example.com or montyuser"
                  />
                </div>
                <div>
                  <label htmlFor="password" className={labelClass}>
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
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
                <p className="text-center text-muted text-sm pt-2">
                  New to Monty?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-accent font-medium"
                  >
                    Create account
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className={labelClass}>
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelClass}>
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClass}
                      placeholder="Smith"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="username" className={labelClass}>
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputClass}
                    placeholder="yourname"
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className={labelClass}>
                    Password
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>

                {/* Display name preference */}
                <div>
                  <label className={labelClass}>
                    Display name — how the app greets you
                  </label>
                  <p
                    className="text-xs text-muted mb-2"
                    style={{ letterSpacing: "0.03em" }}
                  >
                    Username is public. First name is personal.
                  </p>
                  <div className="flex gap-3">
                    {[
                      { val: "username", label: `@${username || "username"}` },
                      { val: "first_name", label: firstName || "First Name" },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDisplayNamePref(val)}
                        className="flex-1 py-2.5 text-sm font-bold tracking-[0.15em] uppercase transition-all active:scale-[0.98] cursor-pointer"
                        style={{
                          clipPath:
                            "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
                          background:
                            displayNamePref === val
                              ? "var(--color-accent)"
                              : "transparent",
                          color:
                            displayNamePref === val
                              ? "#000"
                              : "var(--color-muted)",
                          border:
                            displayNamePref === val
                              ? "none"
                              : "1px solid var(--color-border)",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <ChamferButton
                  type="submit"
                  disabled={loading}
                  className="mt-2"
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </ChamferButton>
                <p className="text-center text-muted text-sm pt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-accent font-medium"
                  >
                    Log in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
