import { useNavigate, useLocation, Link } from "react-router-dom";
import { Home, Dumbbell, User, BarChart3, LogOut, Flame } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SideNav({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { label: "Dashboard", icon: <Home size={18} />, path: "/dashboard" },
    { label: "Workouts", icon: <Dumbbell size={18} />, path: "/workouts" },
    { label: "Analytics", icon: <BarChart3 size={18} />, path: "/analytics" },
    { label: "Challenges", icon: <Flame size={18} />, path: "/challenges" },
    { label: "Profile", icon: <User size={18} />, path: "/profile" },
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
      {/* Overlay — always mounted, opacity-controlled for smooth fade */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/70 z-[55] transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel — slides in/out */}
      <div
        className={`fixed left-0 top-[57px] bottom-0 bg-surface w-64 border-r border-border flex flex-col z-[60] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex-1 overflow-y-auto pt-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className={`flex items-center w-full px-5 py-3.5 transition-colors ${
                isActive(item.path)
                  ? "bg-accent-subtle text-accent font-medium border-r-2 border-accent"
                  : "text-muted hover:text-text hover:bg-surface-raised"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border px-5 py-4 space-y-2">
          <Link
            to="/legal"
            onClick={onClose}
            className="block text-xs text-muted hover:text-text transition-colors py-1"
          >
            Terms & Privacy
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-danger hover:text-red-400 transition-colors py-1 text-sm"
          >
            <LogOut size={16} className="mr-3" /> Logout
          </button>
        </div>
      </div>
    </>
  );
}
