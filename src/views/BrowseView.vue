<template>
  <div class="min-h-screen pt-24 pb-20 px-6 md:px-12">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 class="text-3xl font-black text-white">
          {{
            currentGenre || searchQuery
              ? currentGenre || `"${searchQuery}"`
              : "All Movies"
          }}
        </h1>
        <p class="text-white/40 text-sm mt-1">
          {{ pagination.total }}
          {{ pagination.total === 1 ? "movie" : "movies" }} found
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Genre filter -->
        <select
          v-model="filters.genre"
          @change="applyFilters"
          class="filter-select"
        >
          <option value="">All Genres</option>
          <option v-for="genre in allGenres" :key="genre" :value="genre">
            {{ genre }}
          </option>
        </select>

        <!-- Sort -->
        <select
          v-model="filters.sort"
          @change="applyFilters"
          class="filter-select"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="rating">Top Rated</option>
          <option value="popular">Most Popular</option>
          <option value="title">A-Z</option>
        </select>

        <!-- Year -->
        <select
          v-model="filters.year"
          @change="applyFilters"
          class="filter-select"
        >
          <option value="">Any Year</option>
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
    </div>

    <!-- Active genre pills -->
    <div v-if="currentGenre" class="flex items-center gap-2 mb-6">
      <span class="text-sm text-white/50">Filtering by:</span>
      <span
        class="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-sm text-red-400"
      >
        {{ currentGenre }}
        <button @click="clearGenre" class="hover:text-white transition-colors">
          <Icon icon="mdi:close" class="text-xs" />
        </button>
      </span>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
    >
      <div
        v-for="i in 18"
        :key="i"
        class="aspect-[2/3] bg-zinc-900 rounded-lg animate-pulse"
      />
    </div>

    <!-- Grid -->
    <div
      v-else-if="movies.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
    >
      <MovieCard
        v-for="movie in movies"
        :key="movie._id"
        :movie="movie"
        size="medium"
        type="rating"
        class="!w-full"
        @play="handlePlay"
        @info="handleInfo"
      />
    </div>

    <!-- Empty -->
    <div v-else class="text-center py-20">
      <Icon
        icon="mdi:movie-search"
        class="text-6xl text-white/20 mb-4 mx-auto block"
      />
      <h3 class="text-xl font-semibold text-white/50 mb-2">No movies found</h3>
      <p class="text-white/30 text-sm">Try adjusting your filters</p>
      <button
        @click="clearAllFilters"
        class="mt-4 text-red-400 hover:text-red-300 text-sm transition-colors"
      >
        Clear all filters
      </button>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination.pages > 1"
      class="flex items-center justify-center gap-2 mt-12"
    >
      <button
        @click="goToPage(pagination.page - 1)"
        :disabled="pagination.page <= 1"
        class="pagination-btn"
      >
        <Icon icon="mdi:chevron-left" />
      </button>
      <template v-for="page in visiblePages" :key="page">
        <span v-if="page === '...'" class="text-white/30 px-2">...</span>
        <button
          v-else
          @click="goToPage(page)"
          class="pagination-btn"
          :class="
            page === pagination.page
              ? 'bg-red-600 border-red-600 text-white'
              : ''
          "
        >
          {{ page }}
        </button>
      </template>
      <button
        @click="goToPage(pagination.page + 1)"
        :disabled="pagination.page >= pagination.pages"
        class="pagination-btn"
      >
        <Icon icon="mdi:chevron-right" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { movieService } from "../services/movie.service";
import MovieCard from "../components/movie/MovieCard.vue";

const route = useRoute();
const router = useRouter();

const movies = ref([]);
const allGenres = ref([]);
const loading = ref(true);
const pagination = ref({ total: 0, page: 1, pages: 1 });

const filters = ref({
  genre: route.query.genre || "",
  sort: route.query.sort || "newest",
  year: route.query.year || "",
  page: parseInt(route.query.page) || 1,
});

const searchQuery = computed(() => route.query.q || "");
const currentGenre = computed(() => filters.value.genre);

const years = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 30 }, (_, i) => current - i);
});

const visiblePages = computed(() => {
  const { page, pages } = pagination.value;
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const pages_ = [];
  if (page > 3) pages_.push(1, "...");
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++)
    pages_.push(i);
  if (page < pages - 2) pages_.push("...", pages);
  return pages_;
});

async function fetchMovies() {
  loading.value = true;
  try {
    const params = {
      page: filters.value.page,
      limit: 24,
      sort: filters.value.sort,
    };
    if (filters.value.genre) params.genre = filters.value.genre;
    if (filters.value.year) params.year = filters.value.year;
    if (searchQuery.value) params.q = searchQuery.value;

    const endpoint = searchQuery.value
      ? movieService.searchMovies(searchQuery.value, params)
      : movieService.getMovies(params);
    const data = await endpoint;
    movies.value = data.movies || [];
    pagination.value = data.pagination || { total: 0, page: 1, pages: 1 };
  } catch {
    movies.value = [];
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  filters.value.page = 1;
  updateURL();
  fetchMovies();
}

function updateURL() {
  const query = {};
  if (filters.value.genre) query.genre = filters.value.genre;
  if (filters.value.sort !== "newest") query.sort = filters.value.sort;
  if (filters.value.year) query.year = filters.value.year;
  if (filters.value.page > 1) query.page = filters.value.page;
  if (searchQuery.value) query.q = searchQuery.value;
  router.replace({ query });
}

function clearGenre() {
  filters.value.genre = "";
  applyFilters();
}

function clearAllFilters() {
  filters.value = { genre: "", sort: "newest", year: "", page: 1 };
  router.replace({ query: {} });
  fetchMovies();
}

function goToPage(page) {
  filters.value.page = page;
  updateURL();
  fetchMovies();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handlePlay(movie) {
  router.push(`/watch/${movie._id}`);
}

function handleInfo(movie) {
  router.push(`/movie/${movie._id}`);
}

watch(
  () => route.query.q,
  () => fetchMovies()
);
watch(
  () => route.query.genre,
  (val) => {
    filters.value.genre = val || "";
    fetchMovies();
  }
);

onMounted(async () => {
  allGenres.value = await movieService.getGenres().catch(() => []);
  await fetchMovies();
});
</script>

<style scoped>
@reference "tailwindcss";
.filter-select {
  @apply bg-white/5 border border-white/10 text-white/70 text-sm rounded-lg px-3 py-2 outline-none hover:border-white/20 focus:border-red-500/50 transition-all cursor-pointer;
}
.pagination-btn {
  @apply w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm;
}
</style>