import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, Dumbbell, BarChart3, User } from "lucide-react";

const BACK_KEY = "montyBackStack";
const FWD_KEY = "montyForwardStack";
const FLAG_KEY = "montyNavFlag";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const backStack = JSON.parse(sessionStorage.getItem(BACK_KEY) || "[]");
    if (backStack.length === 0) {
      sessionStorage.setItem(BACK_KEY, JSON.stringify([location.pathname]));
      sessionStorage.setItem(FWD_KEY, JSON.stringify([]));
    }
  }, [location.pathname]);

  useEffect(() => {
    const flag = sessionStorage.getItem(FLAG_KEY);
    const backStack = JSON.parse(sessionStorage.getItem(BACK_KEY) || "[]");
    const forwardStack = JSON.parse(sessionStorage.getItem(FWD_KEY) || "[]");
    const last = backStack[backStack.length - 1];
    if (flag === "back" || flag === "forward") {
      sessionStorage.removeItem(FLAG_KEY);
    } else {
      if (last !== location.pathname) {
        backStack.push(location.pathname);
        sessionStorage.setItem(BACK_KEY, JSON.stringify(backStack));
        sessionStorage.setItem(FWD_KEY, JSON.stringify([]));
      }
    }
    setCanGoBack(backStack.length > 1);
    setCanGoForward(forwardStack.length > 0);
  }, [location.pathname]);

  const goBack = () => {
    let backStack = JSON.parse(sessionStorage.getItem(BACK_KEY) || "[]");
    let forwardStack = JSON.parse(sessionStorage.getItem(FWD_KEY) || "[]");
    if (backStack.length > 1) {
      const current = backStack.pop();
      forwardStack.push(current);
      sessionStorage.setItem(BACK_KEY, JSON.stringify(backStack));
      sessionStorage.setItem(FWD_KEY, JSON.stringify(forwardStack));
      sessionStorage.setItem(FLAG_KEY, "back");
      navigate(backStack[backStack.length - 1]);
    }
  };

  const goForward = () => {
    let backStack = JSON.parse(sessionStorage.getItem(BACK_KEY) || "[]");
    let forwardStack = JSON.parse(sessionStorage.getItem(FWD_KEY) || "[]");
    if (forwardStack.length > 0) {
      const next = forwardStack.pop();
      backStack.push(next);
      sessionStorage.setItem(BACK_KEY, JSON.stringify(backStack));
      sessionStorage.setItem(FWD_KEY, JSON.stringify(forwardStack));
      sessionStorage.setItem(FLAG_KEY, "forward");
      navigate(next);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Home", icon: <Home size={20} /> },
    { path: "/workouts", label: "Workouts", icon: <Dumbbell size={20} /> },
    { path: "/analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
    { path: "/profile", label: "Profile", icon: <User size={20} /> },
  ];

  const ArrowBtn = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center w-10 h-10 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
      style={{
        color: disabled ? "var(--color-surface-raised)" : "var(--color-muted)",
        border: `1px solid ${
          disabled ? "var(--color-surface-raised)" : "var(--color-accent-15)"
        }`,
      }}
    >
      {children}
    </button>
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "var(--color-bg)",
        borderTop: "1px solid #00c8ffcc",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        <ArrowBtn onClick={goBack} disabled={!canGoBack}>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </ArrowBtn>

        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center h-12 transition-all duration-200 gap-0.5 px-3 cursor-pointer"
              style={
                active
                  ? {
                      color: "var(--color-accent)",
                      background: "var(--color-accent-subtle)",
                      border: "1px solid var(--color-accent-35)",
                      clipPath:
                        "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
                      minWidth: "56px",
                    }
                  : {
                      color: "var(--color-muted)",
                      border: "1px solid transparent",
                      minWidth: "44px",
                    }
              }
            >
              <span className="flex items-center justify-center">
                {item.icon}
              </span>
              {active && (
                <span className="text-[8px] font-medium leading-none tracking-wider uppercase whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        <ArrowBtn onClick={goForward} disabled={!canGoForward}>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </ArrowBtn>
      </div>
    </nav>
  );
}
