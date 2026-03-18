<template>
  <div class="min-h-screen pt-24 pb-20 px-6 md:px-12">
    <h1 class="text-3xl font-black text-white mb-2">My List</h1>
    <p class="text-white/40 text-sm mb-8">
      {{ pagination.total }} saved movies
    </p>

    <div
      v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
    >
      <div
        v-for="i in 12"
        :key="i"
        class="aspect-[2/3] bg-zinc-900 rounded-lg animate-pulse"
      />
    </div>

    <div
      v-else-if="movies.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
    >
      <div v-for="item in movies" :key="item.movieId" class="relative group">
        <MovieCard
          :movie="{ _id: item.movieId, title: 'Movie' }"
          size="medium"
          class="!w-full"
          @play="router.push(`/watch/${item.movieId}`)"
          @info="router.push(`/movie/${item.movieId}`)"
        />
        <button
          @click="removeFromWatchlist(item.movieId)"
          class="absolute top-2 right-2 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
        >
          <Icon icon="mdi:close" class="text-white text-sm" />
        </button>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <Icon
        icon="mdi:bookmark-outline"
        class="text-6xl text-white/20 mb-4 mx-auto block"
      />
      <h3 class="text-xl font-semibold text-white/50 mb-2">
        Your list is empty
      </h3>
      <p class="text-white/30 text-sm mb-6">Save movies to watch later</p>
      <router-link
        to="/browse"
        class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors text-sm"
      >
        Browse Movies
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { userService } from "../services/user.service";
import { useToast } from "../composables/useToast";
import MovieCard from "../components/movie/MovieCard.vue";

const router = useRouter();
const toast = useToast();

const movies = ref([]);
const pagination = ref({ total: 0 });
const loading = ref(true);

async function removeFromWatchlist(movieId) {
  try {
    await userService.removeFromWatchlist(movieId);
    movies.value = movies.value.filter((m) => m.movieId !== movieId);
    pagination.value.total = Math.max(0, pagination.value.total - 1);
    toast.info("Removed from My List");
  } catch {
    toast.error("Failed to remove");
  }
}

onMounted(async () => {
  try {
    const data = await userService.getWatchlist();
    movies.value = data.watchlist || [];
    pagination.value = data.pagination || { total: movies.value.length };
  } finally {
    loading.value = false;
  }
});
</script>