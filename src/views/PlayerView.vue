<template>
  <div class="min-h-screen bg-black flex flex-col">
    <!-- Player bar -->
    <div
      class="flex items-center justify-between px-6 py-3 bg-black/80 backdrop-blur border-b border-white/5"
    >
      <button
        @click="goBack"
        class="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
      >
        <Icon icon="mdi:arrow-left" class="text-lg" />
        Back
      </button>
      <p class="text-white font-medium text-sm truncate max-w-xs">
        {{ movie?.title }}
      </p>
      <div class="w-16" />
    </div>

    <!-- Video player -->
    <div class="flex-1 flex items-center justify-center bg-black relative">
      <!-- Loading state -->
      <div
        v-if="loading"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4"
      >
        <BaseSpinner size="xl" />
        <p class="text-white/50 text-sm">Loading stream...</p>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4"
      >
        <Icon icon="mdi:alert-circle" class="text-5xl text-red-500" />
        <p class="text-white/70 text-center max-w-sm">{{ error }}</p>
        <button
          @click="loadStream"
          class="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
        <router-link
          :to="`/movie/${route.params.id}`"
          class="text-white/40 hover:text-white text-sm transition-colors"
        >
          Back to movie details
        </router-link>
      </div>

      <!-- Subscription required -->
      <div
        v-else-if="subscriptionRequired"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6"
      >
        <Icon icon="mdi:crown" class="text-6xl text-amber-400" />
        <h2 class="text-2xl font-bold text-white text-center">
          Upgrade Required
        </h2>
        <p class="text-white/50 text-center max-w-sm">
          This movie requires a
          <strong class="text-amber-400 capitalize">{{ requiredPlan }}</strong>
          plan. Upgrade to continue watching.
        </p>
        <router-link
          to="/settings"
          class="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all"
        >
          Upgrade Plan
        </router-link>
      </div>

      <!-- Video element -->
      <video
        v-show="!loading && !error && !subscriptionRequired"
        ref="videoEl"
        class="w-full max-h-screen"
        controls
        autoplay
        preload="auto"
        @timeupdate="handleTimeUpdate"
        @ended="handleEnded"
      />
    </div>

    <!-- Quality selector (bottom bar) -->
    <div
      v-if="streams.length > 1 && !loading && !error"
      class="flex items-center gap-4 px-6 py-3 bg-black/80 border-t border-white/5"
    >
      <span class="text-white/40 text-xs">Quality:</span>
      <div class="flex gap-2">
        <button
          v-for="stream in streams"
          :key="stream.quality"
          @click="switchQuality(stream)"
          class="px-3 py-1 rounded text-xs font-medium transition-all border"
          :class="
            currentQuality === stream.quality
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-white/10 border-white/20 text-white/60 hover:text-white hover:border-white/40'
          "
        >
          {{ stream.quality }}
        </button>
      </div>
      <div class="ml-auto text-xs text-white/30">
        {{ progressPercent }}% watched
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Hls from "hls.js";
import { streamService } from "../services/stream.service";
import { movieService } from "../services/movie.service";
import { useAuthStore } from "../stores/auth.store";
import BaseSpinner from "../components/ui/BaseSpinner.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const videoEl = ref(null);
const movie = ref(null);
const streams = ref([]);
const sessionToken = ref(null);
const loading = ref(true);
const error = ref("");
const subscriptionRequired = ref(false);
const requiredPlan = ref("");
const currentQuality = ref("auto");
const progressSeconds = ref(0);
const durationSeconds = ref(0);
let hls = null;
let progressInterval = null;

const progressPercent = computed(() => {
  if (!durationSeconds.value) return 0;
  return Math.round((progressSeconds.value / durationSeconds.value) * 100);
});

async function loadStream() {
  loading.value = true;
  error.value = "";
  subscriptionRequired.value = false;

  try {
    const movieId = route.params.id;
    const [movieData, streamData] = await Promise.all([
      movieService.getMovie(movieId),
      streamService.getStreamUrls(movieId, "auto"),
    ]);

    movie.value = movieData;
    streams.value = streamData.streams || [];
    sessionToken.value = streamData.session?.sessionToken;

    // Resume from saved progress
    if (streamData.session?.progressSeconds > 10) {
      progressSeconds.value = streamData.session.progressSeconds;
    }

    if (streams.value.length > 0) {
      await playStream(streams.value[0]);
    } else {
      error.value = "No stream available. The video may still be processing.";
    }
  } catch (err) {
    if (err.response?.status === 402) {
      subscriptionRequired.value = true;
      requiredPlan.value =
        err.response?.data?.message?.match(/(\w+) plan/)?.[1] || "basic";
    } else if (err.response?.status === 503) {
      error.value =
        "This movie is still being processed. Please try again in a few minutes.";
    } else {
      error.value = err.response?.data?.message || "Failed to load stream.";
    }
  } finally {
    loading.value = false;
  }
}

async function playStream(stream) {
  const url = stream.url;
  currentQuality.value = stream.quality;
  durationSeconds.value = stream.duration || 0;

  if (Hls.isSupported()) {
    if (hls) hls.destroy();
    hls = new Hls({ enableWorker: true, lowLatencyMode: false });
    hls.loadSource(url);
    hls.attachMedia(videoEl.value);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (progressSeconds.value > 0) {
        videoEl.value.currentTime = progressSeconds.value;
      }
      videoEl.value.play().catch(() => {});
    });
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        error.value = "Stream error. Please try again.";
        loading.value = false;
      }
    });
  } else if (videoEl.value?.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari native HLS
    videoEl.value.src = url;
    if (progressSeconds.value > 0) {
      videoEl.value.currentTime = progressSeconds.value;
    }
    videoEl.value.play().catch(() => {});
  } else {
    error.value = "Your browser does not support HLS streaming.";
  }
}

function switchQuality(stream) {
  const currentTime = videoEl.value?.currentTime || 0;
  progressSeconds.value = currentTime;
  playStream(stream);
}

function handleTimeUpdate() {
  progressSeconds.value = videoEl.value?.currentTime || 0;
  durationSeconds.value = videoEl.value?.duration || 0;
}

function handleEnded() {
  saveProgress(true);
}

async function saveProgress(completed = false) {
  if (!route.params.id || !progressSeconds.value) return;
  try {
    await streamService.saveProgress(route.params.id, {
      progressSeconds: Math.floor(progressSeconds.value),
      durationSeconds: Math.floor(durationSeconds.value),
      quality: currentQuality.value,
    });
  } catch {
    // ignore — non-critical
  }
}

function goBack() {
  saveProgress();
  router.back();
}

onMounted(async () => {
  if (!auth.isAuthenticated) {
    router.push({ name: "auth", query: { redirect: route.fullPath } });
    return;
  }
  await loadStream();
  // Save progress every 30 seconds
  progressInterval = setInterval(() => saveProgress(), 30000);
});

onUnmounted(() => {
  saveProgress();
  if (hls) hls.destroy();
  if (progressInterval) clearInterval(progressInterval);
});
</script>