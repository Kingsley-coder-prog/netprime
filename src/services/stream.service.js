import api from "./api.service";

export const streamService = {
  async getStreamUrls(movieId, quality = "auto") {
    const { data } = await api.get(`/api/stream/${movieId}`, {
      params: { quality },
    });
    return data.data;
  },

  async saveProgress(movieId, payload) {
    await api.post(`/api/stream/${movieId}/progress`, payload);
  },

  async getProgress(movieId) {
    const { data } = await api.get(`/api/stream/${movieId}/progress`);
    return data.data;
  },

  async getHistory(params = {}) {
    const { data } = await api.get("/api/stream/history", { params });
    return data.data;
  },

  async removeFromHistory(movieId) {
    await api.delete(`/api/stream/history/${movieId}`);
  },

  async getAnalytics() {
    const { data } = await api.get("/api/stream/admin/analytics");
    return data.data;
  },
};
