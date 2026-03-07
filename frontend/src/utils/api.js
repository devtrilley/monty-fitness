import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401s and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        localStorage.setItem("access_token", data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
};

export const getAccessToken = () => {
  return localStorage.getItem("access_token");
};

// Auth API
export const register = async (username, email, password) => {
  const { data } = await api.post("/auth/register", {
    username,
    email,
    password,
  });
  setAccessToken(data.access_token);
  return { data, ok: true };
};

export const login = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });
  setAccessToken(data.access_token);
  return { data, ok: true };
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch {
    // Ignore errors
  }
  setAccessToken(null);
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export const updateProfile = async (bio, profilePhotoUrl) => {
  const { data } = await api.put("/auth/me", {
    bio,
    profile_photo_url: profilePhotoUrl,
  });
  return data;
};

// Exercise API
export const getExercises = async (filters = {}) => {
  const { data } = await api.get("/exercises", { params: filters });
  return data;
};

// Routine API
export const getRoutines = async () => {
  const { data } = await api.get("/routines");
  return data;
};

export const createRoutine = async (routineData) => {
  const { data } = await api.post("/routines", routineData);
  return data;
};

export const getRoutineById = async (id) => {
  const { data } = await api.get(`/routines/${id}`);
  return data.routine; // ← Return just the routine object
};

export const updateRoutine = async (id, routineData) => {
  const { data } = await api.put(`/routines/${id}`, routineData);
  return data.routine;
};

export const startWorkout = async (routineId) => {
  const { data } = await api.post(`/workouts/start/${routineId}`);
  return data;
};

export const startEmptyWorkout = async () => {
  const { data } = await api.post(`/workouts/start-empty`);
  return data;
};

export const finishWorkout = async (sessionId, workoutData) => {
  const { data } = await api.post(`/workouts/${sessionId}/finish`, workoutData);
  return data;
};

export const discardWorkout = async (sessionId) => {
  const { data } = await api.delete(`/workouts/${sessionId}/discard`);
  return data;
};

export const getCompletedWorkout = async (workoutId) => {
  const { data } = await api.get(`/workouts/${workoutId}`);
  return data.workout;
};

export const getWorkoutSession = async (sessionId) => {
  const { data } = await api.get(`/workouts/${sessionId}/session`);
  return data.workout;
};

export const deleteRoutine = async (id) => {
  const { data } = await api.delete(`/routines/${id}`);
  return data;
};

export const getWorkoutHistory = async (limit = 20) => {
  const { data } = await api.get("/workouts/history", { params: { limit } });
  return data;
};

// ======================
// FOLDER API
// ======================
export const getFolders = async () => {
  const { data } = await api.get("/folders");
  return data;
};

export const createFolder = async (name) => {
  const { data } = await api.post("/folders", { name });
  return data;
};

export const renameFolder = async (id, name) => {
  const { data } = await api.put(`/folders/${id}`, { name });
  return data;
};

export const deleteFolder = async (id) => {
  const { data } = await api.delete(`/folders/${id}`);
  return data;
};

export const moveRoutineToFolder = async (routineId, folderId) => {
  const { data } = await api.patch(`/routines/${routineId}/move`, {
    folder_id: folderId,
  });
  return data;
};

// ======================
// ✅ CHALLENGES API
// ======================
export const startChallengeDay = async (challengeId) => {
  const { data } = await api.post(`/challenges/${challengeId}/start-day`);
  return data;
};

export const getChallenges = async () => {
  const { data } = await api.get("/challenges");
  return data.challenges;
};

export const joinChallenge = async (challengeId) => {
  const { data } = await api.post(`/challenges/${challengeId}/join`);
  return data;
};

export const markChallengeComplete = async (challengeId) => {
  const { data } = await api.post(`/challenges/${challengeId}/mark-complete`);
  return data;
};

export const getAnalyticsSummary = async () => {
  const { data } = await api.get("/analytics/summary");
  return data;
};

export const getAnalyticsVolume = async (range = "3months") => {
  const { data } = await api.get(`/analytics/volume?range=${range}`);
  return data.data;
};

export const getPersonalRecords = async () => {
  const { data } = await api.get("/analytics/personal-records");
  return data.prs;
};

export const getChallengeProgress = async () => {
  const { data } = await api.get("/challenges/progress");
  return data.progress;
};

// ======================
// ADMIN API
// ======================
export const adminGetUsers = async () => {
  const { data } = await api.get("/admin/users");
  return data.users;
};

export const adminDeactivateUser = async (userId) => {
  const { data } = await api.patch(`/admin/users/${userId}/deactivate`);
  return data;
};

export const adminDeleteUser = async (userId) => {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
};

export const adminLogin = async (email, password) => {
  const { data } = await api.post("/auth/admin-login", { email, password });
  setAccessToken(data.access_token);
  return { data, ok: true };
};
