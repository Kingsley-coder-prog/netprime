import { ref } from "vue";
import { movieService } from "../services/movie.service";

export function useMovies() {
  const movies = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({ total: 0, page: 1, limit: 20, pages: 1 });

  async function fetchMovies(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const result = await movieService.getMovies(params);
      movies.value = result.movies || [];
      pagination.value = result.pagination || pagination.value;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to load movies";
    } finally {
      loading.value = false;
    }
  }

  async function loadMore(params = {}) {
    if (pagination.value.page >= pagination.value.pages) return;
    loading.value = true;
    try {
      const result = await movieService.getMovies({
        ...params,
        page: pagination.value.page + 1,
      });
      movies.value = [...movies.value, ...(result.movies || [])];
      pagination.value = result.pagination || pagination.value;
    } finally {
      loading.value = false;
    }
  }

  return { movies, loading, error, pagination, fetchMovies, loadMore };
}
