import api from './axios';

/** AI requests can take a while - give them more time than normal calls. */
const AI_TIMEOUT_MS = 150000;

/** Portfolio API calls (all require login, except getPublic). */
const portfolioService = {
  /** -> [{ id, name, templateId, primaryColor, colorMode, slug, published, createdAt, updatedAt }] */
  async list() {
    const { data } = await api.get('/portfolios');
    return data;
  },

  /** -> { id, name, templateId, design, content, avatarPath, publishing, ... } */
  async get(id) {
    const { data } = await api.get(`/portfolios/${id}`);
    return data;
  },

  /** { name, templateId, prefillFromProfile } */
  async create(payload) {
    const { data } = await api.post('/portfolios', payload);
    return data;
  },

  /** { name, templateId, design, content } */
  async update(id, payload) {
    const { data } = await api.put(`/portfolios/${id}`, payload);
    return data;
  },

  async duplicate(id) {
    const { data } = await api.post(`/portfolios/${id}/duplicate`);
    return data;
  },

  async remove(id) {
    await api.delete(`/portfolios/${id}`);
  },

  // ---------------- AI (Phase 7) ----------------

  /** -> { aiConfigured, dailyLimit, remainingToday } */
  async aiStatus() {
    const { data } = await api.get('/portfolios/ai/status');
    return data;
  },

  /** { name, templateId, resumeId, useAi, tone } -> full portfolio */
  async generate(payload) {
    const { data } = await api.post('/portfolios/generate', payload, { timeout: AI_TIMEOUT_MS });
    return data;
  },

  /** -> suggestions { headline, tagline, about, contactMessage, skillGroups, projectDescriptions } (not saved) */
  async aiWrite(id, tone) {
    const { data } = await api.post(`/portfolios/${id}/ai/write`, { tone }, { timeout: AI_TIMEOUT_MS });
    return data;
  },

  // ---------------- Publishing (Phase 7) ----------------

  /** Checks an address; without a value the server suggests one. -> { slug, available, message } */
  async checkSlug(id, value) {
    const params = value === undefined ? {} : { value };
    const { data } = await api.get(`/portfolios/${id}/slug`, { params });
    return data;
  },

  /** Publishes (or republishes) the current draft at /p/{slug}. -> full portfolio */
  async publish(id, slug) {
    const { data } = await api.post(`/portfolios/${id}/publish`, { slug });
    return data;
  },

  async unpublish(id) {
    const { data } = await api.post(`/portfolios/${id}/unpublish`);
    return data;
  },

  /** Public, no login: -> { slug, templateId, design, content, avatarPath, publishedAt } */
  async getPublic(slug) {
    const { data } = await api.get(`/public/portfolios/${encodeURIComponent(slug)}`);
    return data;
  },
};

export default portfolioService;
