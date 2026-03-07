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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <span className="font-bold text-white">Monty Admin</span>
            <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
              restricted
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: activeUsers.length },
            { label: "Total Workouts", value: totalWorkouts },
            { label: "Active", value: activeUsers.filter(u => u.is_active).length },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Users</h2>
          </div>

          {loading && (
            <div className="px-5 py-10 text-center text-gray-500 text-sm">Loading...</div>
          )}
          {error && (
            <div className="px-5 py-10 text-center text-red-400 text-sm">{error}</div>
          )}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Workouts</th>
                    <th className="px-5 py-3 text-left">Last Login</th>
                    <th className="px-5 py-3 text-left">Joined</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-white">
                        {u.username}
                        {u.is_admin && (
                          <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                            admin
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">{u.email}</td>
                      <td className="px-5 py-3.5 text-gray-300">{u.total_workouts}</td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          u.is_active
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                        }`}>
                          {u.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {!u.is_admin && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeactivate(u.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-gray-700"
                            >
                              {u.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                            >
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