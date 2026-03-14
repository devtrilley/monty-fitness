import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

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

    // Don't try to refresh for auth endpoints
    const isAuthEndpoint = originalRequest.url?.includes("/auth/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
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
        window.location.href = "/auth";
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
// Auth API
export const register = async (
  firstName,
  lastName,
  username,
  email,
  password,
  displayNamePref
) => {
  try {
    const { data } = await api.post("/auth/register", {
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      password,
      display_name_preference: displayNamePref || "username",
    });
    setAccessToken(data.access_token);
    return { data, ok: true };
  } catch (err) {
    const message = err.response?.data?.error || "Registration failed";
    return { data: { error: message }, ok: false };
  }
};

export const login = async (email, password) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    setAccessToken(data.access_token);
    return { data, ok: true };
  } catch (err) {
    const message = err.response?.data?.error || "Login failed";
    return { data: { error: message }, ok: false };
  }
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

export const updateProfile = async (
  firstName,
  lastName,
  bio,
  profilePhotoUrl,
  displayNamePref
) => {
  const body = {
    first_name: firstName,
    last_name: lastName,
    bio,
    profile_photo_url: profilePhotoUrl,
  };
  if (displayNamePref !== undefined) {
    body.display_name_preference = displayNamePref;
  }
  const { data } = await api.put("/auth/me", body);
  return data;
};

// Exercise API
export const getExercises = async (filters = {}) => {
  const { data } = await api.get("/exercises", { params: filters });
  return data;
};

export const getExerciseFilters = async () => {
  const { data } = await api.get("/exercises/filters");
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
// TEMPLATE API
// ======================
export const getTemplateRoutines = async () => {
  const { data } = await api.get("/routines/templates");
  return data;
};

export const saveTemplateRoutine = async (routineId, folderId = null) => {
  const { data } = await api.post(`/routines/templates/${routineId}/save`, {
    folder_id: folderId,
  });
  return data;
};

export const saveTemplateFolder = async (folderId) => {
  const { data } = await api.post(
    `/routines/templates/folder/${folderId}/save`
  );
  return data;
};

// ======================
// UPLOAD API
// ======================
export const getPresignedUrl = async (fileType, uploadType = "profile") => {
  const { data } = await api.post("/upload/presign", {
    file_type: fileType,
    upload_type: uploadType,
  });
  return data;
};

export const uploadToS3 = async (presignedUrl, file) => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`S3 upload failed: ${response.status} ${errorText}`);
  }

  return true;
};

export const saveWorkoutPhoto = async (workoutId, photoUrl) => {
  const { data } = await api.patch(`/workouts/${workoutId}/photo`, {
    photo_url: photoUrl,
  });
  return data;
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
