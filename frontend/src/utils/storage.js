/**
 * Thin wrappers around localStorage for auth data.
 * Wrapped in try/catch because storage can be unavailable
 * (e.g. some private-browsing modes).
 */
const TOKEN_KEY = 'careercraft_token';
const USER_KEY = 'careercraft_user';

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable - ignore */
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable - ignore */
  }
}

export const tokenStorage = {
  get: () => safeGet(TOKEN_KEY),
  set: (token) => safeSet(TOKEN_KEY, token),
  clear: () => safeRemove(TOKEN_KEY),
};

export const userStorage = {
  get: () => {
    const raw = safeGet(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  set: (user) => safeSet(USER_KEY, JSON.stringify(user)),
  clear: () => safeRemove(USER_KEY),
};
