// Centralized API Service for Savastro – Mood & Healing Tracker

const TOKEN_KEY = 'sov_jwt_token';
const USER_KEY = 'sov_user';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
};

export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setUser = (user) => {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (e) {}
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {}
};

// Backward-compatible alias
export const user = getUser;

/**
 * Builds the fully qualified API URL.
 * Normalizes VITE_API_URL / VITE_API_BASE_URL to avoid duplicated or missing /api.
 */
export const getApiUrl = (endpoint) => {
  const clean = (endpoint || '').replace(/^\/+/, '');
  const envUrl = (
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
    ''
  ).trim();

  if (!envUrl) {
    if (clean.startsWith('api/')) return `/${clean}`;
    return `/api/${clean}`;
  }

  const base = envUrl.replace(/\/+$/, '');
  if (base.endsWith('/api')) {
    const sub = clean.startsWith('api/') ? clean.slice(4) : clean;
    return `${base}/${sub}`;
  } else if (clean.startsWith('api/')) {
    return `${base}/${clean}`;
  } else {
    return `${base}/api/${clean}`;
  }
};

/**
 * Core HTTP dispatcher.
 */
export const api = async (endpoint, body, customHeaders = {}) => {
  const url = getApiUrl(endpoint);
  const token = getToken();
  const currentUser = getUser();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(currentUser?.email ? { 'x-user': currentUser.email } : {}),
    ...customHeaders
  };

  let response;
  try {
    response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (netErr) {
    throw new Error('Network error: Unable to connect to the backend server. Please verify your connection.');
  }

  const contentType = response.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      const text = await response.text().catch(() => '');
      throw new Error(`Invalid JSON response from server (${response.status}): ${text.slice(0, 100)}`);
    }
  } else {
    const text = await response.text().catch(() => '');
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Endpoint not found (404). Please ensure your backend is deployed and running.');
      }
      throw new Error(`Server returned status ${response.status}: ${text.slice(0, 120) || response.statusText}`);
    }
    data = text;
  }

  if (!response.ok) {
    // If session expired, clear token
    if (response.status === 401 && token) {
      clearSession();
    }
    const message =
      data && typeof data === 'object' && (data.error || data.message)
        ? data.error || data.message
        : `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Dedicated authentication API methods
export const authApi = {
  login: async ({ email, password }) => {
    const data = await api('auth/login', { email, password });
    if (data.token) setToken(data.token);
    if (data.user) setUser(data.user);
    return data;
  },

  register: async ({ name, email, password }) => {
    const data = await api('auth/register', { name, email, password });
    if (data.token) setToken(data.token);
    if (data.user) setUser(data.user);
    return data;
  },

  verifyEmail: async (token) => {
    const data = await api(`auth/verify-email?token=${encodeURIComponent(token)}`);
    if (data.token) setToken(data.token);
    if (data.user) setUser(data.user);
    return data;
  },

  resendVerification: async (email) => {
    return api('auth/resend-verification', { email });
  },

  forgotPassword: async (email) => {
    return api('auth/forgot-password', { email });
  },

  resetPassword: async ({ token, password }) => {
    const data = await api('auth/reset-password', { token, password });
    if (data.token) setToken(data.token);
    if (data.user) setUser(data.user);
    return data;
  },

  getMe: async () => {
    return api('auth/me');
  },

  logout: () => {
    clearSession();
  }
};

export default api;
