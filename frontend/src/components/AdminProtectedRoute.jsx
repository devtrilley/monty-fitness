import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}