<template>
  <Teleport to="body">
    <Transition name="hover-card">
      <div
        v-if="show && movie"
        class="fixed z-[8000] w-72 bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl border border-white/10"
        :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      >
        <!-- Backdrop -->
        <div class="relative h-40 overflow-hidden">
          <img
            :src="backdropUrl"
            :alt="movie.title"
            class="w-full h-full object-cover"
            @error="$event.target.src = '/placeholder-backdrop.jpg'"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent"
          />
          <!-- Play button -->
          <div class="absolute inset-0 flex items-center justify-center">
            <button
              @click="$emit('play', movie)"
              class="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
            >
              <Icon icon="mdi:play" class="text-black text-xl ml-0.5" />
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="p-4">
          <h3 class="text-white font-bold text-sm mb-1 line-clamp-1">
            {{ movie.title }}
          </h3>

          <!-- Meta row -->
          <div class="flex items-center gap-2 mb-2 text-xs">
            <span
              v-if="movie.rating?.average"
              class="text-green-400 font-semibold"
            >
              {{ Math.round(movie.rating.average * 10) }}% Match
            </span>
            <span class="text-white/40">{{ movie.releaseYear }}</span>
            <span
              class="border border-white/20 text-white/50 px-1 py-0.5 rounded text-xs"
            >
              {{ movie.ageRating || "NR" }}
            </span>
            <span v-if="movie.durationFormatted" class="text-white/40">{{
              movie.durationFormatted
            }}</span>
          </div>

          <!-- Genres -->
          <div class="flex flex-wrap gap-1 mb-3">
            <span
              v-for="genre in (movie.genres || []).slice(0, 3)"
              :key="genre"
              class="text-xs text-white/50"
            >
              {{ genre }}<span class="mx-1 text-white/20">•</span>
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <router-link
              :to="`/movie/${movie._id}`"
              class="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 rounded-lg text-center transition-colors"
            >
              More Info
            </router-link>
            <button
              @click="$emit('watchlist', movie)"
              class="w-9 h-9 rounded-full border border-white/30 hover:border-white flex items-center justify-center transition-colors"
            >
              <Icon icon="mdi:plus" class="text-white text-base" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";
import { tmdbService } from "../../services/tmdb.service";

const props = defineProps({
  show: { type: Boolean, default: false },
  movie: { type: Object, default: null },
  position: { type: Object, default: () => ({ top: 0, left: 0 }) },
});
defineEmits(["play", "watchlist"]);

const backdropUrl = computed(() => {
  if (props.movie?.backdropUrl) return props.movie.backdropUrl;
  return `https://image.tmdb.org/t/p/w780${props.movie?.backdrop_path || ""}`;
});
</script>

<style scoped>
.hover-card-enter-active,
.hover-card-leave-active {
  transition: all 0.15s ease;
}
.hover-card-enter-from,
.hover-card-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>