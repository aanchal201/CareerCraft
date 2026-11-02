import axios from 'axios';
import { tokenStorage } from '../utils/storage';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// A production build without VITE_API_BASE_URL would call localhost and fail
// for every visitor - make that mistake obvious in the browser console.
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.error('VITE_API_BASE_URL is not set: set it in Vercel → Settings → Environment Variables and redeploy.');
}

/**
 * Single configured Axios instance used by every API call in the app.
 *  - baseURL comes from VITE_API_BASE_URL (frontend/.env)
 *  - request interceptor attaches the JWT
 *  - response interceptor logs the user out when the token is rejected (401)
 *
 * No default Content-Type: Axios sets "application/json" for plain objects
 * automatically, and lets the browser set "multipart/form-data; boundary=..."
 * for FormData uploads (a hard-coded JSON header would break file uploads).
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AUTH_LOGOUT_EVENT = 'careercraft:logout';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 while we HAVE a token means the token expired or was revoked.
    // (A 401 on the login form itself has no token, so it is not affected.)
    if (error.response?.status === 401 && tokenStorage.get()) {
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
    return Promise.reject(error);
  }
);

/** Turns an API-relative path such as "/users/1/avatar?v=123" into a full URL. */
export function buildApiUrl(path) {
  if (!path) return null;
  return `${API_BASE_URL}${path}`;
}

/** Turns any Axios error into a human-readable message. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error?.request && !error.response) {
    return 'Cannot reach the server. Check your connection and try again in a moment.';
  }
  return fallback;
}

/** Returns backend field errors ({ email: '...', ... }) if present. */
export function getFieldErrors(error) {
  return error?.response?.data?.fieldErrors || {};
}

export default api;
