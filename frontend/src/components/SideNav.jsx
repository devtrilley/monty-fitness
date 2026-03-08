import { useNavigate, useLocation, Link } from "react-router-dom";
import { Home, Dumbbell, User, BarChart3, LogOut, Flame } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SideNav({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { label: "Dashboard", icon: <Home size={17} />, path: "/dashboard" },
    { label: "Workouts", icon: <Dumbbell size={17} />, path: "/workouts" },
    { label: "Analytics", icon: <BarChart3 size={17} />, path: "/analytics" },
    { label: "Challenges", icon: <Flame size={17} />, path: "/challenges" },
    { label: "Profile", icon: <User size={17} />, path: "/profile" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (
      path === "/dashboard" &&
      (location.pathname === "/" || location.pathname === "/dashboard")
    )
      return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path))
      return true;
    return false;
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[55] transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.85)" }}
      />

      <div
        className={`fixed left-0 top-[57px] bottom-0 w-64 flex flex-col z-[60] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--color-bg)",
          borderRight: "1px solid #00c8ffcc",
        }}
      >
        {/* Logo area */}
        <div
          className="px-5 py-4 mb-2"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <p
            className="text-xs tracking-[0.3em] uppercase font-medium glow-text"
            style={{
              color: "var(--color-accent)",
              fontFamily: "monospace",
            }}
          >
            MONTY FITNESS
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className="flex items-center w-full px-5 py-3.5 transition-all duration-200"
                style={
                  active
                    ? {
                        color: "var(--color-accent)",
                        background: "var(--color-accent-subtle)",
                        borderRight: "2px solid var(--color-accent)",
                        borderLeft: "2px solid var(--color-accent-30)",
                        textShadow: "0 0 8px var(--color-accent-60)",
                      }
                    : {
                        color: "var(--color-muted)",
                        borderRight: "2px solid transparent",
                        borderLeft: "2px solid transparent",
                      }
                }
              >
                <span className="mr-3">{item.icon}</span>
                <span className="text-sm font-medium tracking-wide">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div
          className="px-5 py-4 space-y-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <Link
            to="/legal"
            onClick={onClose}
            className="block text-xs tracking-wide transition-colors py-1"
            style={{ color: "var(--color-muted)" }}
          >
            Terms & Privacy
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-sm transition-colors py-1"
            style={{ color: "var(--color-danger)" }}
          >
            <LogOut size={15} className="mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
