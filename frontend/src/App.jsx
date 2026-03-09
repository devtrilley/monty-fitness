import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Workouts from "./pages/Workouts";
import CreateRoutine from "./pages/CreateRoutine";
import ViewRoutine from "./pages/ViewRoutine";
import EditRoutine from "./pages/EditRoutine";
import ActiveWorkout from "./pages/ActiveWorkout";
import WorkoutDetails from "./pages/WorkoutDetails";
import Analytics from "./pages/Analytics";
import Challenges from "./pages/Challenges";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Legal from "./pages/Legal";
import BottomNav from "./components/BottomNav";
import TronToaster from "./components/TronToaster";

// Must be inside BrowserRouter to access useLocation
function AppRoutes() {
  const location = useLocation();
  // Don't show BottomNav on auth/admin pages
  const hideNav = ["/login", "/register", "/admin-login", "/admin"].includes(
    location.pathname
  );
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <Routes location={location}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts"
              element={
                <ProtectedRoute>
                  <Workouts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/workouts/create"
              element={
                <ProtectedRoute>
                  <CreateRoutine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts/:id"
              element={
                <ProtectedRoute>
                  <ViewRoutine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts/:id/edit"
              element={
                <ProtectedRoute>
                  <EditRoutine />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts/session/:sessionId"
              element={
                <ProtectedRoute>
                  <ActiveWorkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts/history/:id"
              element={
                <ProtectedRoute>
                  <WorkoutDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/challenges"
              element={
                <ProtectedRoute>
                  <Challenges />
                </ProtectedRoute>
              }
            />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <Admin />
                </AdminProtectedRoute>
              }
            />
            <Route path="/legal" element={<Legal />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TronToaster />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
