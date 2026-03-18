import { ref, computed } from "vue";
import { tmdbService } from "../services/tmdb.service";

// Composable that enriches a movie object with TMDB poster/backdrop if missing
export function useMoviePoster(movie) {
  const tmdbData = ref(null);
  const loading = ref(false);

  const posterUrl = computed(() => {
    if (movie.value?.posterUrl) return movie.value.posterUrl;
    return tmdbData.value?.poster || "/placeholder-poster.jpg";
  });

  const backdropUrl = computed(() => {
    if (movie.value?.backdropUrl) return movie.value.backdropUrl;
    return tmdbData.value?.backdrop || "/placeholder-backdrop.jpg";
  });

  async function fetchTmdb() {
    if (!movie.value?.title) return;
    if (movie.value.posterUrl && movie.value.backdropUrl) return;

    loading.value = true;
    try {
      tmdbData.value = await tmdbService.getMovieImages(
        movie.value.title,
        movie.value.releaseYear,
      );
    } finally {
      loading.value = false;
    }
  }

  return { posterUrl, backdropUrl, fetchTmdb, loading };
}

// Simple function for one-off poster fetch
export async function getMoviePoster(title, year, existingUrl) {
  if (existingUrl) return existingUrl;
  const images = await tmdbService.getMovieImages(title, year);
  return images.poster || "/placeholder-poster.jpg";
}

export async function getMovieBackdrop(title, year, existingUrl) {
  if (existingUrl) return existingUrl;
  const images = await tmdbService.getMovieImages(title, year);
  return images.backdrop || "/placeholder-backdrop.jpg";
}
