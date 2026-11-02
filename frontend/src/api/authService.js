import api from './axios';

/**
 * All authentication-related API calls.
 * Components never call Axios directly - they go through services like this one.
 */
const authService = {
  /** POST /api/auth/register -> { accessToken, tokenType, expiresIn, user } */
  async register({ fullName, email, password }) {
    const { data } = await api.post('/auth/register', { fullName, email, password });
    return data;
  },

  /** POST /api/auth/login -> { accessToken, tokenType, expiresIn, user } */
  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  /** GET /api/users/me -> current user (requires token) */
  async getCurrentUser() {
    const { data } = await api.get('/users/me');
    return data;
  },
};

export default authService;
