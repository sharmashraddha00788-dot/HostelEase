// Fetch API wrapper with automatic JWT Bearer authentication and Silent Token Refresh

const getAuthTokens = () => {
  return {
    accessToken: localStorage.getItem('hostelease_access_token'),
    refreshToken: localStorage.getItem('hostelease_refresh_token'),
  };
};

const setAuthTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('hostelease_access_token', accessToken);
  if (refreshToken) localStorage.setItem('hostelease_refresh_token', refreshToken);
};

const clearAuthTokens = () => {
  localStorage.removeItem('hostelease_access_token');
  localStorage.removeItem('hostelease_refresh_token');
  localStorage.removeItem('hostelease_user');
};

// Refresh token in flight promise to prevent multiple parallel refresh calls
let refreshTokenPromise = null;

const refreshAccessToken = async () => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const { refreshToken } = getAuthTokens();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Token refresh failed');
      }

      setAuthTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch (err) {
      clearAuthTokens();
      // Only redirect if we are inside browser app
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?session=expired';
      }
      throw err;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

// Generic request helper with retry
const apiRequest = async (url, options = {}, isRetry = false) => {
  const { accessToken } = getAuthTokens();

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'Unexpected response from server' };
    }

    // Handle token expired & silent refresh (only if not already a retry and not calling auth endpoints)
    if (
      response.status === 401 &&
      !isRetry &&
      !url.includes('/api/auth/login') &&
      !url.includes('/api/auth/refresh')
    ) {
      try {
        const newAccessToken = await refreshAccessToken();
        // Retry the original request with the new access token
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.message || 'Request failed after refresh');
        }
        return retryData;
      } catch (refreshErr) {
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const api = {
  get: (url, headers = {}) => apiRequest(url, { method: 'GET', headers }),
  post: (url, body, headers = {}) =>
    apiRequest(url, { method: 'POST', body: JSON.stringify(body), headers }),
  patch: (url, body, headers = {}) =>
    apiRequest(url, { method: 'PATCH', body: JSON.stringify(body), headers }),
  delete: (url, headers = {}) => apiRequest(url, { method: 'DELETE', headers }),
};

export { getAuthTokens, setAuthTokens, clearAuthTokens };
