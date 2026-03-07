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
    {
      path: "/dashboard",
      label: "Home",
      icon: <Home size={22} />,
    },
    {
      path: "/workouts",
      label: "Workouts",
      icon: <Dumbbell size={22} />,
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: <BarChart3 size={22} />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <User size={22} />,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around items-center h-16 px-1">
        {/* Back */}
        <button
          onClick={goBack}
          disabled={!canGoBack}
          aria-label="Go Back"
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
            canGoBack
              ? "text-muted hover:text-text hover:bg-surface-raised active:scale-95"
              : "text-muted/30 cursor-not-allowed"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        {/* Nav Items */}
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 gap-0.5 ${
              isActive(item.path)
                ? "text-accent bg-accent-subtle"
                : "text-muted hover:text-text hover:bg-surface-raised active:scale-95"
            }`}
          >
            <span className="flex items-center justify-center">
              {item.icon}
            </span>
            <span className="text-[9px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        ))}

        {/* Forward */}
        <button
          onClick={goForward}
          disabled={!canGoForward}
          aria-label="Go Forward"
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
            canGoForward
              ? "text-muted hover:text-text hover:bg-surface-raised active:scale-95"
              : "text-muted/30 cursor-not-allowed"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}
