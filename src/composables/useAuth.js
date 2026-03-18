import { useAuthStore } from "../stores/auth.store";

// Thin wrapper around auth store for convenience in components
export function useAuth() {
  return useAuthStore();
}
