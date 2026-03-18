<template>
  <div class="min-h-screen pt-24 pb-20 px-6 md:px-12 max-w-3xl mx-auto">
    <h1 class="text-3xl font-black text-white mb-8">Settings</h1>

    <div class="space-y-6">
      <!-- Playback preferences -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-5">Playback</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-white">Default Quality</p>
              <p class="text-xs text-white/40">
                Auto adjusts based on connection speed
              </p>
            </div>
            <select
              v-model="prefs.preferredQuality"
              @change="savePreferences"
              class="setting-select"
            >
              <option value="auto">Auto</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </div>
          <div
            class="flex items-center justify-between border-t border-white/5 pt-4"
          >
            <div>
              <p class="text-sm font-medium text-white">Autoplay</p>
              <p class="text-xs text-white/40">
                Automatically play next episode
              </p>
            </div>
            <button
              @click="
                prefs.autoplay = !prefs.autoplay;
                savePreferences();
              "
              class="w-12 h-6 rounded-full transition-all relative"
              :class="prefs.autoplay ? 'bg-red-600' : 'bg-white/20'"
            >
              <div
                class="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                :class="prefs.autoplay ? 'left-6' : 'left-0.5'"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-5">Notifications</h2>
        <div class="space-y-4">
          <div
            v-for="item in notificationSettings"
            :key="item.key"
            class="flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-medium text-white">{{ item.label }}</p>
              <p class="text-xs text-white/40">{{ item.description }}</p>
            </div>
            <button
              @click="
                prefs.notifications[item.key] = !prefs.notifications[item.key];
                savePreferences();
              "
              class="w-12 h-6 rounded-full transition-all relative"
              :class="
                prefs.notifications[item.key] ? 'bg-red-600' : 'bg-white/20'
              "
            >
              <div
                class="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                :class="prefs.notifications[item.key] ? 'left-6' : 'left-0.5'"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Genre preferences -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-5">Preferred Genres</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="genre in allGenres"
            :key="genre"
            @click="toggleGenre(genre)"
            class="px-4 py-2 rounded-full text-sm font-medium transition-all border"
            :class="
              prefs.preferredGenres.includes(genre)
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30'
            "
          >
            {{ genre }}
          </button>
        </div>
        <button
          @click="savePreferences"
          class="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-all"
        >
          Save Preferences
        </button>
      </div>

      <!-- Account -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-5">Account</h2>
        <div class="space-y-3">
          <button
            @click="handleLogoutAll"
            class="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/70 hover:text-white transition-all flex items-center gap-3"
          >
            <Icon icon="mdi:logout-variant" class="text-lg text-white/40" />
            Sign out of all devices
          </button>
          <router-link
            to="/profile"
            class="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/70 hover:text-white transition-all flex items-center gap-3"
          >
            <Icon icon="mdi:account-edit" class="text-lg text-white/40" />
            Edit profile
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { userService } from "../services/user.service";
import { movieService } from "../services/movie.service";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/auth.store";
import { useToast } from "../composables/useToast";

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const allGenres = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
];

const prefs = ref({
  preferredQuality: "auto",
  autoplay: true,
  preferredGenres: [],
  notifications: { email: true, push: true },
});

const notificationSettings = [
  {
    key: "email",
    label: "Email Notifications",
    description: "Receive updates via email",
  },
  {
    key: "push",
    label: "Push Notifications",
    description: "Browser push notifications",
  },
];

function toggleGenre(genre) {
  const idx = prefs.value.preferredGenres.indexOf(genre);
  if (idx === -1) prefs.value.preferredGenres.push(genre);
  else prefs.value.preferredGenres.splice(idx, 1);
}

async function savePreferences() {
  try {
    await userService.updatePreferences(prefs.value);
    toast.success("Preferences saved");
  } catch {
    toast.error("Failed to save preferences");
  }
}

async function handleLogoutAll() {
  await authService.logoutAll();
  await auth.logout();
  router.push("/auth");
}

onMounted(async () => {
  try {
    const profile = await userService.getProfile();
    if (profile.preferences) {
      prefs.value = {
        preferredQuality: profile.preferences.preferredQuality || "auto",
        autoplay: profile.preferences.autoplay !== false,
        preferredGenres: profile.preferences.preferredGenres || [],
        notifications: profile.preferences.notifications || {
          email: true,
          push: true,
        },
      };
    }
  } catch {
    // use defaults
  }
});
</script>

<style scoped>
@reference "tailwindcss";
.setting-select {
  @apply bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-red-500/50 transition-all;
}
</style>