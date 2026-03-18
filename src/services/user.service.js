import api from "./api.service";

export const userService = {
  async getProfile() {
    const { data } = await api.get("/api/users/me");
    return data.data.user;
  },

  async updateProfile(payload) {
    const { data } = await api.patch("/api/users/me", payload);
    return data.data.user;
  },

  async updatePreferences(payload) {
    const { data } = await api.patch("/api/users/me/preferences", payload);
    return data.data.user;
  },

  async getWatchlist(params = {}) {
    const { data } = await api.get("/api/users/me/watchlist", { params });
    return data.data;
  },

  async addToWatchlist(movieId) {
    const { data } = await api.post(`/api/users/me/watchlist/${movieId}`);
    return data;
  },

  async removeFromWatchlist(movieId) {
    const { data } = await api.delete(`/api/users/me/watchlist/${movieId}`);
    return data;
  },

  // Admin
  async getAllUsers(params = {}) {
    const { data } = await api.get("/api/users", { params });
    return data.data;
  },

  async updateSubscription(userId, payload) {
    const { data } = await api.patch(
      `/api/users/${userId}/subscription`,
      payload,
    );
    return data.data;
  },

  async updateUserStatus(userId, isActive) {
    const { data } = await api.patch(`/api/users/${userId}/status`, {
      isActive,
    });
    return data.data;
  },
};
