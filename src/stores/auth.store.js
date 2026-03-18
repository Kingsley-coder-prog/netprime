import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(localStorage.getItem("accessToken") || null);
  const initialized = ref(false);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");
  const isPremium = computed(() => {
    const plan = user.value?.subscription?.plan;
    return plan === "premium" || plan === "basic";
  });

  async function initialize() {
    if (initialized.value) return;
    initialized.value = true;

    if (!token.value) return;

    try {
      const userData = await authService.me();
      user.value = userData;
    } catch {
      // Token invalid — clear everything
      token.value = null;
      localStorage.removeItem("accessToken");
    }
  }

  async function login(email, password) {
    loading.value = true;
    try {
      const { accessToken, user: userData } = await authService.login(
        email,
        password,
      );
      token.value = accessToken;
      user.value = userData;
      localStorage.setItem("accessToken", accessToken);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    } finally {
      loading.value = false;
    }
  }

  async function register(payload) {
    loading.value = true;
    try {
      const { accessToken, user: userData } = await authService.register(
        payload,
      );
      token.value = accessToken;
      user.value = userData;
      localStorage.setItem("accessToken", accessToken);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed",
      };
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem("accessToken");
    }
  }

  async function refreshProfile() {
    try {
      const profile = await userService.getProfile();
      // Merge subscription + preferences from user-service
      if (user.value) {
        user.value = { ...user.value, ...profile };
      }
    } catch {
      // ignore
    }
  }

  function setToken(newToken) {
    token.value = newToken;
    localStorage.setItem("accessToken", newToken);
  }

  return {
    user,
    token,
    initialized,
    loading,
    isAuthenticated,
    isAdmin,
    isPremium,
    initialize,
    login,
    register,
    logout,
    refreshProfile,
    setToken,
  };
});
