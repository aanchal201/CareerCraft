import api from './axios';

/** Resume API calls (all require login). */
const resumeService = {
  /** -> [{ id, title, templateId, accentColor, createdAt, updatedAt }] newest first */
  async list() {
    const { data } = await api.get('/resumes');
    return data;
  },

  /** -> full resume { id, title, templateId, accentColor, content, ... } */
  async get(id) {
    const { data } = await api.get(`/resumes/${id}`);
    return data;
  },

  /** { title, templateId, prefillFromProfile } -> full resume */
  async create(payload) {
    const { data } = await api.post('/resumes', payload);
    return data;
  },

  /** { title, templateId, accentColor, content } -> full resume */
  async update(id, payload) {
    const { data } = await api.put(`/resumes/${id}`, payload);
    return data;
  },

  async duplicate(id) {
    const { data } = await api.post(`/resumes/${id}/duplicate`);
    return data;
  },

  async remove(id) {
    await api.delete(`/resumes/${id}`);
  },
};

export default resumeService;
