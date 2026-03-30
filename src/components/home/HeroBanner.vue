<template>
  <div class="relative h-[85vh] min-h-[500px] overflow-hidden">
    <!-- Backdrop — keyed to current movie for fade transition -->
    <Transition name="fade">
      <div :key="currentMovie?._id" class="absolute inset-0">
        <img
          v-if="currentBackdrop"
          :src="currentBackdrop"
          :alt="currentMovie?.title"
          class="w-full h-full object-cover object-top"
        />
        <div
          v-else
          class="w-full h-full bg-gradient-to-br from-zinc-900 to-black"
        />
      </div>
    </Transition>

    <!-- Gradients -->
    <div
      class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"
    />
    <div
      class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"
    />
    <div
      class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent"
    />

    <!-- Content -->
    <div class="relative h-full flex items-center pt-16">
      <div class="px-6 md:px-12 max-w-2xl">
        <!-- Loading skeleton -->
        <template v-if="loading">
          <div class="h-10 w-80 bg-white/10 rounded animate-pulse mb-4" />
          <div class="h-4 w-96 bg-white/10 rounded animate-pulse mb-2" />
          <div class="h-4 w-72 bg-white/10 rounded animate-pulse mb-8" />
          <div class="flex gap-3">
            <div class="h-12 w-28 bg-white/10 rounded animate-pulse" />
            <div class="h-12 w-28 bg-white/10 rounded animate-pulse" />
          </div>
        </template>

        <template v-else-if="currentMovie">
          <Transition name="content-fade" mode="out-in">
            <div :key="currentMovie._id">
              <!-- Meta -->
              <div class="flex items-center gap-3 mb-3 text-sm text-white/60">
                <span
                  v-if="currentMovie.rating?.average"
                  class="flex items-center gap-1 text-yellow-400 font-semibold"
                >
                  <Icon icon="mdi:star" class="text-base" />
                  {{ currentMovie.rating.average.toFixed(1) }}
                </span>
                <span v-if="currentMovie.releaseYear">{{
                  currentMovie.releaseYear
                }}</span>
                <span
                  v-if="currentMovie.ageRating"
                  class="border border-white/30 px-1.5 py-0.5 rounded text-xs"
                >
                  {{ currentMovie.ageRating }}
                </span>
                <span v-if="currentMovie.durationFormatted">{{
                  currentMovie.durationFormatted
                }}</span>
              </div>

              <!-- Title -->
              <h1
                class="text-4xl md:text-6xl font-black text-white leading-tight mb-4 tracking-tight"
              >
                {{ currentMovie.title }}
              </h1>

              <!-- Genres -->
              <div class="flex flex-wrap gap-2 mb-4">
                <span
                  v-for="genre in (currentMovie.genres || []).slice(0, 4)"
                  :key="genre"
                  class="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10"
                >
                  {{ genre }}
                </span>
              </div>

              <!-- Description -->
              <p
                class="text-white/70 text-sm md:text-base leading-relaxed mb-8 line-clamp-3 max-w-xl"
              >
                {{ currentMovie.description }}
              </p>

              <!-- Buttons -->
              <div class="flex items-center gap-3">
                <button
                  @click="handlePlay"
                  class="flex items-center gap-2 px-8 py-3 bg-white hover:bg-white/90 text-black font-bold rounded-lg text-sm transition-all hover:scale-105 shadow-2xl"
                >
                  <Icon icon="mdi:play" class="text-xl ml-0.5" />
                  Play
                </button>
                <button
                  @click="handleWatchlist"
                  class="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg text-sm transition-all backdrop-blur-sm border border-white/20"
                >
                  <Icon
                    :icon="inWatchlist ? 'mdi:check' : 'mdi:plus'"
                    class="text-lg"
                  />
                  {{ inWatchlist ? "In My List" : "My List" }}
                </button>
                <button
                  @click="handleInfo"
                  class="w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full transition-all backdrop-blur-sm border border-white/20"
                >
                  <Icon icon="mdi:information-outline" class="text-xl" />
                </button>
              </div>
            </div>
          </Transition>
        </template>
      </div>
    </div>

    <!-- Slide indicators (dots) -->
    <div
      v-if="movies.length > 1"
      class="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10"
    >
      <button
        v-for="(m, i) in movies"
        :key="m._id"
        @click="goToSlide(i)"
        class="transition-all duration-300 rounded-full"
        :class="
          i === currentIndex
            ? 'w-6 h-2 bg-white'
            : 'w-2 h-2 bg-white/40 hover:bg-white/70'
        "
      />
    </div>

    <!-- Progress bar -->
    <div
      v-if="movies.length > 1"
      class="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10"
    >
      <div
        class="h-full bg-red-500 transition-none"
        :style="{ width: `${progress}%`, transition: 'width 0.1s linear' }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { tmdbService } from "../../services/tmdb.service";
import { userService } from "../../services/user.service";
import { useAuthStore } from "../../stores/auth.store";
import { useToast } from "../../composables/useToast";

const props = defineProps({
  movie: { type: Object, default: null }, // single movie (legacy support)
  movies: { type: Array, default: () => [] }, // multiple featured movies
  loading: { type: Boolean, default: false },
});

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

// ── Rotation state ────────────────────────────────────────────
const INTERVAL_MS = 7000; // 7 seconds per slide
const currentIndex = ref(0);
const progress = ref(0);
const tmdbBackdrops = ref({}); // cache: movieId → backdrop URL
let timer = null;
let progressTimer = null;

// Support both single movie prop and movies array
const allMovies = computed(() => {
  if (props.movies?.length > 0) return props.movies;
  if (props.movie) return [props.movie];
  return [];
});

const currentMovie = computed(
  () => allMovies.value[currentIndex.value] || null
);

const currentBackdrop = computed(() => {
  if (!currentMovie.value) return null;
  if (currentMovie.value.backdropUrl) return currentMovie.value.backdropUrl;
  return tmdbBackdrops.value[currentMovie.value._id] || null;
});

const inWatchlist = ref(false);

// ── Auto-rotate ───────────────────────────────────────────────
function startRotation() {
  stopRotation();
  if (allMovies.value.length <= 1) return;

  progress.value = 0;
  const startTime = Date.now();

  progressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    progress.value = Math.min((elapsed / INTERVAL_MS) * 100, 100);
  }, 100);

  timer = setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % allMovies.value.length;
    startRotation();
  }, INTERVAL_MS);
}

function stopRotation() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function goToSlide(index) {
  currentIndex.value = index;
  startRotation();
}

// ── TMDB images ───────────────────────────────────────────────
async function fetchTmdbBackdrop(movie) {
  if (!movie || movie.backdropUrl || tmdbBackdrops.value[movie._id]) return;
  try {
    const images = await tmdbService.getMovieImages(
      movie.title,
      movie.releaseYear
    );
    if (images.backdrop) {
      tmdbBackdrops.value[movie._id] = images.backdrop;
    }
  } catch {}
}

// Fetch backdrops for all movies upfront
watch(
  allMovies,
  async (movies) => {
    for (const movie of movies) {
      fetchTmdbBackdrop(movie);
    }
    if (movies.length > 0) startRotation();
  },
  { immediate: true }
);

// ── Actions ───────────────────────────────────────────────────
function handlePlay() {
  if (!auth.isAuthenticated) return router.push("/auth");
  router.push(`/watch/${currentMovie.value._id}`);
}

function handleInfo() {
  router.push(`/movie/${currentMovie.value._id || currentMovie.value.slug}`);
}

async function handleWatchlist() {
  if (!auth.isAuthenticated) return router.push("/auth");
  try {
    const id = currentMovie.value._id;
    if (inWatchlist.value) {
      await userService.removeFromWatchlist(id);
      inWatchlist.value = false;
      toast.info("Removed from My List");
    } else {
      await userService.addToWatchlist(id);
      inWatchlist.value = true;
      toast.success("Added to My List");
    }
  } catch {
    toast.error("Failed to update watchlist");
  }
}

onMounted(() => startRotation());
onUnmounted(() => stopRotation());
</script>

<style scoped>
/* Backdrop crossfade */
.fade-enter-active {
  transition: opacity 1.2s ease;
}
.fade-leave-active {
  transition: opacity 1.2s ease;
  position: absolute;
  inset: 0;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Content fade (title, description, buttons) */
.content-fade-enter-active {
  transition: all 0.6s ease 0.3s;
}
.content-fade-leave-active {
  transition: all 0.3s ease;
}
.content-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.content-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>