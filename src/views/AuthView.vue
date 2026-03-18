<template>
  <div
    class="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]"
  >
    <!-- Background -->
    <div class="absolute inset-0">
      <div
        class="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-black"
      />
      <div
        class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"
      />
      <div
        class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-800/10 rounded-full blur-3xl"
      />
    </div>

    <!-- Card -->
    <div class="relative w-full max-w-md mx-4">
      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link
          to="/"
          class="text-red-500 font-black text-3xl tracking-wider"
        >
          NETPRIME
        </router-link>
      </div>

      <div
        class="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <!-- Tabs -->
        <div class="flex border-b border-white/10">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-1 py-4 text-sm font-medium transition-all duration-200 relative"
            :class="
              activeTab === tab.id
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            "
          >
            {{ tab.label }}
            <div
              v-if="activeTab === tab.id"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            />
          </button>
        </div>

        <div class="p-8">
          <!-- Login form -->
          <form
            v-if="activeTab === 'login'"
            @submit.prevent="handleLogin"
            class="space-y-4"
          >
            <div>
              <label
                class="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider"
                >Email</label
              >
              <input
                v-model="loginForm.email"
                type="email"
                required
                placeholder="you@example.com"
                class="input-field"
              />
            </div>
            <div>
              <label
                class="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider"
                >Password</label
              >
              <div class="relative">
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  placeholder="••••••••"
                  class="input-field pr-12"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  <Icon :icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'" />
                </button>
              </div>
              <div class="text-right mt-1">
                <button
                  type="button"
                  @click="activeTab = 'forgot'"
                  class="text-xs text-white/40 hover:text-red-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div
              v-if="error"
              class="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              <Icon icon="mdi:alert-circle" />
              {{ error }}
            </div>

            <button
              type="submit"
              :disabled="auth.loading"
              class="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Icon
                v-if="auth.loading"
                icon="mdi:loading"
                class="animate-spin"
              />
              {{ auth.loading ? "Signing in..." : "Sign In" }}
            </button>
          </form>

          <!-- Register form -->
          <form
            v-else-if="activeTab === 'register'"
            @submit.prevent="handleRegister"
            class="space-y-4"
          >
            <div>
              <label
                class="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider"
                >Full Name</label
              >
              <input
                v-model="registerForm.name"
                type="text"
                required
                placeholder="John Doe"
                class="input-field"
              />
            </div>
            <div>
              <label
                class="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider"
                >Email</label
              >
              <input
                v-model="registerForm.email"
                type="email"
                required
                placeholder="you@example.com"
                class="input-field"
              />
            </div>
            <div>
              <label
                class="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider"
                >Password</label
              >
              <div class="relative">
                <input
                  v-model="registerForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  placeholder="Min 8 chars, uppercase + number"
                  class="input-field pr-12"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  <Icon :icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'" />
                </button>
              </div>
            </div>
            <div>
              <label
                class="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider"
                >Confirm Password</label
              >
              <input
                v-model="registerForm.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="input-field"
              />
            </div>

            <div
              v-if="error"
              class="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              <Icon icon="mdi:alert-circle" />
              {{ error }}
            </div>

            <button
              type="submit"
              :disabled="auth.loading"
              class="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Icon
                v-if="auth.loading"
                icon="mdi:loading"
                class="animate-spin"
              />
              {{ auth.loading ? "Creating account..." : "Create Account" }}
            </button>

            <p class="text-xs text-white/30 text-center">
              By signing up, you agree to our Terms of Use and Privacy Policy.
            </p>
          </form>

          <!-- Forgot password -->
          <form
            v-else-if="activeTab === 'forgot'"
            @submit.prevent="handleForgotPassword"
            class="space-y-4"
          >
            <div class="text-center mb-2">
              <Icon
                icon="mdi:lock-reset"
                class="text-4xl text-red-500 mb-2 mx-auto block"
              />
              <p class="text-sm text-white/50">
                Enter your email and we'll send you a reset link.
              </p>
            </div>
            <div>
              <label
                class="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider"
                >Email</label
              >
              <input
                v-model="forgotEmail"
                type="email"
                required
                placeholder="you@example.com"
                class="input-field"
              />
            </div>
            <div
              v-if="forgotSuccess"
              class="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2"
            >
              <Icon icon="mdi:check-circle" />
              Reset link sent — check your inbox.
            </div>
            <button
              type="submit"
              :disabled="forgotLoading"
              class="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
            >
              {{ forgotLoading ? "Sending..." : "Send Reset Link" }}
            </button>
            <button
              type="button"
              @click="activeTab = 'login'"
              class="w-full text-sm text-white/40 hover:text-white transition-colors"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { authService } from "../services/auth.service";
import { useToast } from "../composables/useToast";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const toast = useToast();

const activeTab = ref("login");
const showPassword = ref(false);
const error = ref("");
const forgotEmail = ref("");
const forgotLoading = ref(false);
const forgotSuccess = ref(false);

const tabs = [
  { id: "login", label: "Sign In" },
  { id: "register", label: "Create Account" },
];

const loginForm = ref({ email: "", password: "" });
const registerForm = ref({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

async function handleLogin() {
  error.value = "";
  const result = await auth.login(
    loginForm.value.email,
    loginForm.value.password
  );
  if (result.success) {
    toast.success(`Welcome back, ${auth.user?.name}!`);
    const redirect = route.query.redirect || "/";
    router.push(redirect);
  } else {
    error.value = result.message;
  }
}

async function handleRegister() {
  error.value = "";
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    error.value = "Passwords do not match";
    return;
  }
  const result = await auth.register(registerForm.value);
  if (result.success) {
    toast.success(`Welcome to Netprime, ${auth.user?.name}!`);
    router.push("/");
  } else {
    error.value = result.message;
  }
}

async function handleForgotPassword() {
  forgotLoading.value = true;
  try {
    await authService.forgotPassword(forgotEmail.value);
    forgotSuccess.value = true;
  } catch {
    toast.error("Something went wrong. Please try again.");
  } finally {
    forgotLoading.value = false;
  }
}
</script>

<style scoped>
@reference "tailwindcss";
.input-field {
  @apply w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-red-500/50 focus:bg-white/10 transition-all text-sm;
}
</style>