import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminGetUsers, adminDeactivateUser, adminDeleteUser, logout } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const data = await adminGetUsers();
      setUsers(data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDeactivate = async (userId) => {
    await adminDeactivateUser(userId);
    fetchUsers();
  };

  const handleDelete = async (userId) => {
    if (!confirm("Permanently delete this user and all their data?")) return;
    await adminDeleteUser(userId);
    fetchUsers();
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/admin-login");
  };

  const activeUsers = users.filter(u => !u.is_admin);
  const totalWorkouts = users.reduce((sum, u) => sum + (u.total_workouts || 0), 0);

  return (
    <div className="min-h-screen bg-bg" style={{ color: "var(--color-text)" }}>
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-accent)", boxShadow: "0 0 12px var(--color-accent-60)" }}>
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <span className="font-bold tracking-widest uppercase text-sm"
              style={{ color: "var(--color-text)" }}>
              Monty Admin
            </span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)", border: "1px solid var(--color-accent-30)" }}>
              restricted
            </span>
          </div>
        </div>
        <button onClick={handleLogout}
          className="text-sm transition-colors"
          style={{ color: "var(--color-muted)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--color-text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--color-muted)"}>
          Sign out
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: activeUsers.length },
            { label: "Total Workouts", value: totalWorkouts },
            { label: "Active", value: activeUsers.filter(u => u.is_active).length },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl px-5 py-4"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-muted)" }}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <h2 className="font-semibold tracking-wide" style={{ color: "var(--color-text)" }}>Users</h2>
          </div>

          {loading && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--color-muted)" }}>
              Loading...
            </div>
          )}
          {error && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--color-danger)" }}>
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--color-muted)", borderBottom: "1px solid var(--color-border)" }}>
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Workouts</th>
                    <th className="px-5 py-3 text-left">Last Login</th>
                    <th className="px-5 py-3 text-left">Joined</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="transition-colors"
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: "var(--color-text)" }}>
                        {u.username}
                        {u.is_admin && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "var(--color-warning)20", color: "var(--color-warning)" }}>
                            admin
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "var(--color-muted)" }}>{u.email}</td>
                      <td className="px-5 py-3.5" style={{ color: "var(--color-text)" }}>{u.total_workouts}</td>
                      <td className="px-5 py-3.5" style={{ color: "var(--color-muted)" }}>
                        {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "var(--color-muted)" }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2 py-1 rounded-full font-medium"
                          style={u.is_active ? {
                            background: "var(--color-success)25",
                            color: "var(--color-success)",
                          } : {
                            background: "var(--color-danger)25",
                            color: "var(--color-danger)",
                          }}>
                          {u.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {!u.is_admin && (
                          <div className="flex gap-2">
                            <button onClick={() => handleDeactivate(u.id)}
                              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                              style={{ background: "var(--color-surface-raised)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
                              {u.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button onClick={() => handleDelete(u.id)}
                              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                              style={{ background: "var(--color-accent-subtle)", color: "var(--color-accent)", border: "1px solid var(--color-accent-30)" }}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}