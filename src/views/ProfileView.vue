<template>
  <div class="min-h-screen pt-24 pb-20 px-6 md:px-12 max-w-4xl mx-auto">
    <h1 class="text-3xl font-black text-white mb-8">My Profile</h1>

    <div class="grid md:grid-cols-3 gap-8">
      <!-- Avatar & subscription card -->
      <div class="space-y-4">
        <div
          class="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
        >
          <div
            class="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-3xl font-black mx-auto mb-4"
          >
            {{ auth.user?.name?.[0]?.toUpperCase() }}
          </div>
          <h2 class="text-lg font-bold text-white">{{ auth.user?.name }}</h2>
          <p class="text-white/40 text-sm mb-4">{{ auth.user?.email }}</p>
          <span
            class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
            :class="{
              'bg-zinc-700 text-zinc-300':
                profile?.subscription?.plan === 'free',
              'bg-blue-500/20 text-blue-400':
                profile?.subscription?.plan === 'basic',
              'bg-amber-500/20 text-amber-400':
                profile?.subscription?.plan === 'premium',
            }"
          >
            {{ (profile?.subscription?.plan || "free").toUpperCase() }} PLAN
          </span>
        </div>

        <!-- Subscription details -->
        <div
          class="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3"
        >
          <h3
            class="text-sm font-semibold text-white/60 uppercase tracking-wider"
          >
            Subscription
          </h3>
          <div class="text-sm space-y-2">
            <div class="flex justify-between">
              <span class="text-white/40">Plan</span>
              <span class="text-white capitalize">{{
                profile?.subscription?.plan || "free"
              }}</span>
            </div>
            <div
              v-if="profile?.subscription?.expiresAt"
              class="flex justify-between"
            >
              <span class="text-white/40">Expires</span>
              <span class="text-white">{{
                new Date(profile.subscription.expiresAt).toLocaleDateString()
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-white/40">Auto-renew</span>
              <span
                :class="
                  profile?.subscription?.autoRenew
                    ? 'text-green-400'
                    : 'text-white/40'
                "
              >
                {{ profile?.subscription?.autoRenew ? "On" : "Off" }}
              </span>
            </div>
          </div>
          <router-link
            to="/settings"
            class="block w-full text-center py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-all mt-2"
          >
            Manage Plan
          </router-link>
        </div>
      </div>

      <!-- Edit profile form -->
      <div class="md:col-span-2">
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 class="text-lg font-semibold text-white mb-6">Edit Profile</h3>

          <form @submit.prevent="saveProfile" class="space-y-5">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs text-white/50 mb-1.5 uppercase tracking-wider"
                  >Full Name</label
                >
                <input
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  class="block text-xs text-white/50 mb-1.5 uppercase tracking-wider"
                  >Country</label
                >
                <input
                  v-model="form.country"
                  type="text"
                  class="form-input"
                  placeholder="Nigeria"
                />
              </div>
            </div>

            <div>
              <label
                class="block text-xs text-white/50 mb-1.5 uppercase tracking-wider"
                >Bio</label
              >
              <textarea
                v-model="form.bio"
                rows="3"
                class="form-input resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs text-white/50 mb-1.5 uppercase tracking-wider"
                  >Date of Birth</label
                >
                <input
                  v-model="form.dateOfBirth"
                  type="date"
                  class="form-input"
                />
              </div>
              <div>
                <label
                  class="block text-xs text-white/50 mb-1.5 uppercase tracking-wider"
                  >Language</label
                >
                <select v-model="form.language" class="form-input">
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="pt">Portuguese</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>

            <div class="pt-2">
              <button
                type="submit"
                :disabled="saving"
                class="px-8 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
              >
                {{ saving ? "Saving..." : "Save Changes" }}
              </button>
            </div>
          </form>
        </div>

        <!-- Watch history preview -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-white">Watch History</h3>
            <router-link
              to="/browse"
              class="text-sm text-red-400 hover:text-red-300"
              >Browse more</router-link
            >
          </div>
          <div v-if="recentHistory.length" class="space-y-3">
            <div
              v-for="item in recentHistory.slice(0, 5)"
              :key="item._id"
              class="flex items-center gap-3"
            >
              <div
                class="w-12 h-12 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden"
              >
                <Icon icon="mdi:film" class="w-full h-full p-3 text-zinc-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white truncate">
                  Movie ID: {{ item.movieId }}
                </p>
                <div class="w-full bg-zinc-800 rounded-full h-1 mt-1">
                  <div
                    class="h-1 bg-red-500 rounded-full"
                    :style="{ width: `${item.percentWatched || 0}%` }"
                  />
                </div>
              </div>
              <span class="text-xs text-white/30"
                >{{ item.percentWatched || 0 }}%</span
              >
            </div>
          </div>
          <p v-else class="text-white/30 text-sm text-center py-4">
            No watch history yet
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth.store";
import { userService } from "../services/user.service";
import { streamService } from "../services/stream.service";
import { useToast } from "../composables/useToast";

const auth = useAuthStore();
const toast = useToast();

const profile = ref(null);
const recentHistory = ref([]);
const saving = ref(false);

const form = ref({
  name: "",
  bio: "",
  country: "",
  language: "en",
  dateOfBirth: "",
});

async function saveProfile() {
  saving.value = true;
  try {
    const updated = await userService.updateProfile(form.value);
    profile.value = updated;
    await auth.refreshProfile();
    toast.success("Profile updated!");
  } catch {
    toast.error("Failed to update profile");
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    const [profileData, historyData] = await Promise.all([
      userService.getProfile(),
      streamService.getHistory({ limit: 5 }).catch(() => ({ history: [] })),
    ]);
    profile.value = profileData;
    recentHistory.value = historyData.history || [];

    form.value = {
      name: profileData.name || "",
      bio: profileData.bio || "",
      country: profileData.country || "",
      language: profileData.language || "en",
      dateOfBirth: profileData.dateOfBirth
        ? profileData.dateOfBirth.split("T")[0]
        : "",
    };
  } catch {
    toast.error("Failed to load profile");
  }
});
</script>

<style scoped>
.form-input {
  @apply w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 outline-none focus:border-red-500/50 transition-all text-sm;
}
</style>