<template>
  <div class="relative h-[85vh] min-h-[500px] overflow-hidden">
    <!-- Backdrop -->
    <Transition name="fade" mode="out-in">
      <div :key="movie?._id" class="absolute inset-0">
        <img
          v-if="backdropSrc"
          :src="backdropSrc"
          :alt="movie?.title"
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

        <template v-else-if="movie">
          <!-- Meta -->
          <div class="flex items-center gap-3 mb-3 text-sm text-white/60">
            <span
              v-if="movie.rating?.average"
              class="flex items-center gap-1 text-yellow-400 font-semibold"
            >
              <Icon icon="mdi:star" class="text-base" />
              {{ movie.rating.average.toFixed(1) }}
            </span>
            <span v-if="movie.releaseYear">{{ movie.releaseYear }}</span>
            <span
              v-if="movie.ageRating"
              class="border border-white/30 px-1.5 py-0.5 rounded text-xs"
              >{{ movie.ageRating }}</span
            >
            <span v-if="movie.durationFormatted">{{
              movie.durationFormatted
            }}</span>
          </div>

          <!-- Title -->
          <h1
            class="text-4xl md:text-6xl font-black text-white leading-tight mb-4 tracking-tight"
          >
            {{ movie.title }}
          </h1>

          <!-- Genres -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              v-for="genre in (movie.genres || []).slice(0, 4)"
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
            {{ movie.description }}
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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { tmdbService } from "../../services/tmdb.service";
import { userService } from "../../services/user.service";
import { useAuthStore } from "../../stores/auth.store";
import { useToast } from "../../composables/useToast";

const props = defineProps({
  movie: { type: Object, default: null },
  loading: { type: Boolean, default: false },
});

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const tmdbBackdrop = ref(null);
const inWatchlist = ref(false);

const backdropSrc = computed(() => {
  if (props.movie?.backdropUrl) return props.movie.backdropUrl;
  return tmdbBackdrop.value;
});

watch(
  () => props.movie,
  async (movie) => {
    if (!movie) return;
    if (!movie.backdropUrl && movie.title) {
      const images = await tmdbService.getMovieImages(
        movie.title,
        movie.releaseYear
      );
      tmdbBackdrop.value = images.backdrop;
    }
  },
  { immediate: true }
);

function handlePlay() {
  if (!auth.isAuthenticated) return router.push("/auth");
  router.push(`/watch/${props.movie._id}`);
}

function handleInfo() {
  router.push(`/movie/${props.movie._id || props.movie.slug}`);
}

async function handleWatchlist() {
  if (!auth.isAuthenticated) return router.push("/auth");
  try {
    const id = props.movie._id;
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
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>