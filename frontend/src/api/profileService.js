import api from './axios';

/**
 * Profile API calls. Every function resolves to the FULL updated profile
 * returned by the backend, so callers can simply replace their copy.
 */
const profileService = {
  async getProfile() {
    const { data } = await api.get('/profile');
    return data;
  },

  async updatePersonal(payload) {
    const { data } = await api.put('/profile/personal', payload);
    return data;
  },

  async uploadPicture(file) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/profile/picture', formData);
    return data;
  },

  async deletePicture() {
    const { data } = await api.delete('/profile/picture');
    return data;
  },

  async addEducation(payload) {
    const { data } = await api.post('/profile/education', payload);
    return data;
  },

  async updateEducation(id, payload) {
    const { data } = await api.put(`/profile/education/${id}`, payload);
    return data;
  },

  async deleteEducation(id) {
    const { data } = await api.delete(`/profile/education/${id}`);
    return data;
  },

  async addExperience(payload) {
    const { data } = await api.post('/profile/experience', payload);
    return data;
  },

  async updateExperience(id, payload) {
    const { data } = await api.put(`/profile/experience/${id}`, payload);
    return data;
  },

  async deleteExperience(id) {
    const { data } = await api.delete(`/profile/experience/${id}`);
    return data;
  },

  async addCertification(payload) {
    const { data } = await api.post('/profile/certifications', payload);
    return data;
  },

  async updateCertification(id, payload) {
    const { data } = await api.put(`/profile/certifications/${id}`, payload);
    return data;
  },

  async deleteCertification(id) {
    const { data } = await api.delete(`/profile/certifications/${id}`);
    return data;
  },

  /** skills: [{ name, level }] - replaces the whole list */
  async replaceSkills(skills) {
    const { data } = await api.put('/profile/skills', { skills });
    return data;
  },
};

export default profileService;
