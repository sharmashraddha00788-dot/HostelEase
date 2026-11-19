import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthTokens, clearAuthTokens, getAuthTokens } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check existing session on application mount
  useEffect(() => {
    const initializeAuth = async () => {
      const { accessToken } = getAuthTokens();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        if (response.success && response.user) {
          setUser(response.user);
          localStorage.setItem('hostelease_user', JSON.stringify(response.user));
        }
      } catch (err) {
        console.warn('Initial session check failed:', err.message);
        clearAuthTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.success) {
        setAuthTokens(res.accessToken, res.refreshToken);
        setUser(res.user);
        localStorage.setItem('hostelease_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Student registration handler (Always role student)
  const register = async (name, email, password, phone) => {
    setAuthError(null);
    try {
      const res = await api.post('/api/auth/register', { name, email, password, phone });
      if (res.success) {
        setAuthTokens(res.accessToken, res.refreshToken);
        setUser(res.user);
        localStorage.setItem('hostelease_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      clearAuthTokens();
      setUser(null);
    }
  };

  // Refresh user data (e.g. after room is allotted or vacated)
  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('hostelease_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
