/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  logout as apiLogout,
  getAccessToken,
} from "../utils/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData.user);
        } catch (error) {
          console.error("Failed to load user:", error);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const value = {
    user,
    setUser,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
