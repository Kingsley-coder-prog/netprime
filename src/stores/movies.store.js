import { defineStore } from "pinia";
import { ref } from "vue";
import { movieService } from "../services/movie.service";

export const useMoviesStore = defineStore("movies", () => {
  const featured = ref([]);
  const trending = ref([]);
  const genres = ref([]);
  const loading = ref(false);

  async function fetchFeatured() {
    try {
      featured.value = await movieService.getFeaturedMovies();
    } catch {
      featured.value = [];
    }
  }

  async function fetchTrending() {
    try {
      trending.value = await movieService.getTrendingMovies();
    } catch {
      trending.value = [];
    }
  }

  async function fetchGenres() {
    try {
      genres.value = await movieService.getGenres();
    } catch {
      genres.value = [];
    }
  }

  async function fetchHomeData() {
    loading.value = true;
    await Promise.all([fetchFeatured(), fetchTrending(), fetchGenres()]);
    loading.value = false;
  }

  return {
    featured,
    trending,
    genres,
    loading,
    fetchFeatured,
    fetchTrending,
    fetchGenres,
    fetchHomeData,
  };
});
