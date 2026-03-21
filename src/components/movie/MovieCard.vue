<template>
  <div
    class="group relative cursor-pointer flex-shrink-0 transition-all duration-300 ease-out"
    :class="[sizeClasses[size], hovered ? 'z-20 scale-110' : 'z-0']"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <!-- Poster image -->
    <div
      class="relative overflow-hidden rounded-md bg-zinc-900 aspect-[2/3]"
      :class="size === 'large' ? 'aspect-video' : 'aspect-[2/3]'"
    >
      <img
        v-if="posterSrc"
        :src="posterSrc"
        :alt="movie.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        @error="handleImgError"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 p-3 gap-2"
      >
        <Icon icon="mdi:film" class="text-3xl text-zinc-600" />
        <p
          class="text-zinc-400 text-xs text-center font-medium leading-tight line-clamp-3"
        >
          {{ movie.title }}
        </p>
        <div class="flex flex-wrap gap-1 justify-center">
          <span
            v-for="genre in (movie.genres || []).slice(0, 2)"
            :key="genre"
            class="text-xs text-zinc-500 bg-zinc-700/50 px-1.5 py-0.5 rounded"
            >{{ genre }}</span
          >
        </div>
      </div>

      <!-- Progress bar (continue watching) -->
      <div
        v-if="type === 'progress' && movie.progress"
        class="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700"
      >
        <div
          class="h-full bg-red-500 transition-all"
          :style="{ width: `${movie.progress}%` }"
        />
      </div>

      <!-- Rating badge -->
      <div
        v-if="type === 'rating' && movie.rating"
        class="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5"
      >
        <Icon icon="mdi:star" class="text-yellow-400 text-xs" />
        <span class="text-xs font-semibold text-white">{{
          typeof movie.rating === "object" ? movie.rating.average : movie.rating
        }}</span>
      </div>

      <!-- Hover overlay -->
      <Transition name="fade">
        <div
          v-if="hovered"
          class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3"
        >
          <!-- Action buttons -->
          <div class="flex items-center gap-2 mb-2">
            <button
              @click.stop="$emit('play', movie)"
              class="w-9 h-9 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-all shadow-lg"
            >
              <Icon icon="mdi:play" class="text-black text-lg ml-0.5" />
            </button>
            <button
              @click.stop="handleWatchlist"
              class="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 flex items-center justify-center transition-all"
            >
              <Icon
                :icon="inWatchlist ? 'mdi:check' : 'mdi:plus'"
                class="text-white text-base"
              />
            </button>
            <button
              @click.stop="router.push(`/movie/${movie._id || movie.slug}`)"
              class="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 flex items-center justify-center transition-all ml-auto"
              title="More info"
            >
              <Icon
                icon="mdi:information-outline"
                class="text-white text-base"
              />
            </button>
          </div>

          <!-- Genre tags -->
          <div class="flex flex-wrap gap-1">
            <span
              v-for="genre in (movie.genres || []).slice(0, 3)"
              :key="genre"
              class="text-xs text-white/70"
            >
              {{ genre
              }}<span
                class="text-white/30 ml-1"
                v-if="
                  (movie.genres || []).indexOf(genre) <
                  Math.min((movie.genres || []).length - 1, 2)
                "
                >•</span
              >
            </span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Title below (small size only) -->
    <p
      v-if="size === 'small'"
      class="mt-1.5 text-xs text-white/60 truncate px-0.5 group-hover:text-white transition-colors"
    >
      {{ movie.title }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { tmdbService } from "../../services/tmdb.service";
import { userService } from "../../services/user.service";
import { useAuthStore } from "../../stores/auth.store";
import { useToast } from "../../composables/useToast";

const props = defineProps({
  movie: { type: Object, required: true },
  size: { type: String, default: "medium" }, // small | medium | large
  type: { type: String, default: "default" }, // default | progress | rating
});

const emit = defineEmits(["play", "info", "watchlist-change"]);

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const hovered = ref(false);
const inWatchlist = ref(false);
const tmdbPoster = ref(null);
const imgError = ref(false);

const sizeClasses = {
  small: "w-32",
  medium: "w-40",
  large: "w-64",
};

const posterSrc = computed(() => {
  if (imgError.value) return null;
  if (props.movie.posterUrl) return props.movie.posterUrl;
  return tmdbPoster.value;
});

let hoverTimer = null;

function handleMouseEnter() {
  hoverTimer = setTimeout(() => {
    hovered.value = true;
  }, 300);
}

function handleMouseLeave() {
  clearTimeout(hoverTimer);
  hovered.value = false;
}

function handleClick() {
  router.push(
    `/movie/${props.movie._id || props.movie.slug || props.movie.id}`
  );
}

function handleImgError() {
  imgError.value = true;
}

async function handleWatchlist() {
  if (!auth.isAuthenticated) {
    router.push("/auth");
    return;
  }
  try {
    const id = props.movie._id || props.movie.id;
    if (inWatchlist.value) {
      await userService.removeFromWatchlist(id);
      inWatchlist.value = false;
      toast.info("Removed from My List");
    } else {
      await userService.addToWatchlist(id);
      inWatchlist.value = true;
      toast.success("Added to My List");
    }
    emit("watchlist-change", {
      movie: props.movie,
      inWatchlist: inWatchlist.value,
    });
  } catch {
    toast.error("Failed to update watchlist");
  }
}

// Fetch TMDB poster if no posterUrl
onMounted(async () => {
  if (!props.movie.posterUrl && props.movie.title) {
    const images = await tmdbService.getMovieImages(
      props.movie.title,
      props.movie.releaseYear
    );
    tmdbPoster.value = images.poster;
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>