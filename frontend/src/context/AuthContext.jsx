import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../api/authService';
import { AUTH_LOGOUT_EVENT } from '../api/axios';
import { tokenStorage, userStorage } from '../utils/storage';

export const AuthContext = createContext(null);

/**
 * Holds the logged-in user + token and exposes login/register/logout
 * to the whole app. Wrap the app in <AuthProvider> (see main.jsx) and
 * read it anywhere with the useAuth() hook.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());
  const [user, setUser] = useState(() => userStorage.get());
  // true while we verify a stored token with the backend on first load
  const [initializing, setInitializing] = useState(() => Boolean(tokenStorage.get()));

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    userStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const saveSession = useCallback((authResponse) => {
    tokenStorage.set(authResponse.accessToken);
    userStorage.set(authResponse.user);
    setToken(authResponse.accessToken);
    setUser(authResponse.user);
  }, []);

  // On app start: if a token is stored, confirm it is still valid.
  useEffect(() => {
    if (!tokenStorage.get()) return undefined;

    let cancelled = false;
    authService
      .getCurrentUser()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        userStorage.set(me);
      })
      .catch((error) => {
        // Only drop the session if the server says the token is bad.
        // If the server is simply unreachable, keep the cached session.
        if (!cancelled && error.response?.status === 401) clearSession();
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // The Axios interceptor fires this event when any request gets a 401.
  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, clearSession);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, clearSession);
  }, [clearSession]);

  const login = useCallback(
    async (credentials) => {
      const data = await authService.login(credentials);
      saveSession(data);
      return data.user;
    },
    [saveSession]
  );

  const register = useCallback(
    async (details) => {
      const data = await authService.register(details);
      saveSession(data);
      return data.user;
    },
    [saveSession]
  );

  /** JWTs are stateless: logging out = forgetting the token on this device. */
  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  /**
   * Merge changes into the cached user (e.g. new name or avatar after a
   * profile update) so the top bar updates without another request.
   * Skips the update when nothing actually changed.
   */
  const updateUser = useCallback((changes) => {
    setUser((current) => {
      if (!current) return current;
      const changed = Object.keys(changes).some((key) => current[key] !== changes[key]);
      if (!changed) return current;
      const next = { ...current, ...changes };
      userStorage.set(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      initializing,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, initializing, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
