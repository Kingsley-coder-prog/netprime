<template>
  <div class="min-h-screen">
    <!-- Hero -->
    <HeroBanner :movie="heroMovie" :loading="loading" />

    <!-- Content rows -->
    <div class="relative z-10 -mt-24 pb-20 space-y-12">
      <!-- Featured / Spotlight row -->
      <MovieRow
        v-if="featuredMovies.length"
        title="Featured"
        :movies="featuredMovies"
        size="large"
        type="rating"
        :browse-query="{ sort: 'rating' }"
      />

      <!-- Continue Watching (authenticated users) -->
      <MovieRow
        v-if="auth.isAuthenticated && watchHistory.length"
        title="Continue Watching"
        :movies="watchHistory"
        size="medium"
        type="progress"
      />

      <!-- Trending Now -->
      <MovieRow
        v-if="trendingMovies.length"
        title="Trending Now"
        :movies="trendingMovies"
        size="medium"
        type="rating"
        :browse-query="{ sort: 'popular' }"
      />

      <!-- Browse by Genre -->
      <section v-if="genres.length" class="px-6 md:px-12">
        <h2 class="text-lg md:text-xl font-semibold text-white mb-4">
          Browse by Genre
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <router-link
            v-for="item in genres.slice(0, 6)"
            :key="item"
            :to="{ path: '/browse', query: { genre: item } }"
            class="relative overflow-hidden rounded-lg aspect-video group cursor-pointer"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-red-900/50 to-black flex items-center justify-center"
            >
              <span
                class="text-white font-bold text-sm group-hover:scale-110 transition-transform"
                >{{ item }}</span
              >
            </div>
          </router-link>
        </div>
      </section>

      <!-- New Releases -->
      <MovieRow
        v-if="newMovies.length"
        title="New & Popular"
        :movies="newMovies"
        size="large"
        type="rating"
        :browse-query="{ sort: 'newest' }"
      />

      <!-- Empty state for new users -->
      <div
        v-if="!loading && !featuredMovies.length && !trendingMovies.length"
        class="px-6 md:px-12 py-20 text-center"
      >
        <Icon
          icon="mdi:film-off"
          class="text-6xl text-white/20 mb-4 mx-auto block"
        />
        <h3 class="text-xl font-semibold text-white/50 mb-2">No movies yet</h3>
        <p class="text-white/30 text-sm mb-6">
          Movies will appear here once they've been added and published.
        </p>
        <router-link
          v-if="auth.isAdmin"
          to="/admin/upload"
          class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
        >
          <Icon icon="mdi:upload" />
          Upload your first movie
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth.store";
import { movieService } from "../services/movie.service";
import { streamService } from "../services/stream.service";
import HeroBanner from "../components/home/HeroBanner.vue";
import MovieRow from "../components/home/MovieRow.vue";

const auth = useAuthStore();

const loading = ref(true);
const featuredMovies = ref([]);
const trendingMovies = ref([]);
const newMovies = ref([]);
const genres = ref([]);
const watchHistory = ref([]);

const heroMovie = computed(
  () => featuredMovies.value[0] || trendingMovies.value[0] || null
);

onMounted(async () => {
  loading.value = true;
  try {
    const [featured, trending, newest, genreList] = await Promise.all([
      movieService.getFeaturedMovies().catch(() => []),
      movieService.getTrendingMovies().catch(() => []),
      movieService
        .getMovies({ sort: "newest", limit: 10 })
        .catch(() => ({ movies: [] })),
      movieService.getGenres().catch(() => []),
    ]);

    featuredMovies.value = featured;
    trendingMovies.value = trending;
    newMovies.value = newest.movies || [];
    // API returns [{genre: "Action", count: 5}, ...] — extract just names
    genres.value = genreList
      .map((g) => (typeof g === "object" ? g.genre : g))
      .filter(Boolean);

    // Fetch watch history for authenticated users
    if (auth.isAuthenticated) {
      const history = await streamService
        .getHistory({ limit: 10 })
        .catch(() => ({ history: [] }));
      watchHistory.value = history.history || [];
    }
  } finally {
    loading.value = false;
  }
});
</script>