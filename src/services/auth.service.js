import api from "./api.service";

export const authService = {
  async register(payload) {
    const { data } = await api.post("/api/auth/register", payload);
    return data.data;
  },

  async login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    return data.data;
  },

  async logout() {
    await api.post("/api/auth/logout");
  },

  async logoutAll() {
    await api.post("/api/auth/logout-all");
  },

  async refresh() {
    const { data } = await api.post("/api/auth/refresh");
    return data.data;
  },

  async me() {
    const { data } = await api.get("/api/auth/me");
    return data.data.user;
  },

  async forgotPassword(email) {
    const { data } = await api.post("/api/auth/forgot-password", { email });
    return data;
  },

  async resetPassword(token, password, confirmPassword) {
    const { data } = await api.post("/api/auth/reset-password", {
      token,
      password,
      confirmPassword,
    });
    return data;
  },
};
