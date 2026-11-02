import api from './axios';

/** AI analysis takes a while (the model reads and reasons), so allow up to 2.5 minutes. */
const ANALYSIS_TIMEOUT_MS = 150_000;

/** Resume analyzer API calls (all require login). */
const analysisService = {
  /**
   * Starts an analysis. Pass EITHER a PDF file OR a saved resumeId,
   * plus an optional job description. -> full analysis
   */
  async analyze({ file, resumeId, jobDescription }) {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (resumeId) formData.append('resumeId', resumeId);
    if (jobDescription && jobDescription.trim()) formData.append('jobDescription', jobDescription.trim());
    const { data } = await api.post('/analyses', formData, { timeout: ANALYSIS_TIMEOUT_MS });
    return data;
  },

  /** -> [{ id, sourceType, sourceName, jobTitle, atsScore, matchScore, createdAt, ... }] */
  async list() {
    const { data } = await api.get('/analyses');
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/analyses/${id}`);
    return data;
  },

  async remove(id) {
    await api.delete(`/analyses/${id}`);
  },

  /** -> { aiConfigured, model, dailyLimit, usedToday, remainingToday } */
  async status() {
    const { data } = await api.get('/analyses/status');
    return data;
  },
};

export default analysisService;
