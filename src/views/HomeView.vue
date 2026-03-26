<template>
  <div class="min-h-screen">
    <HeroBanner :movie="heroMovie" :loading="loading" />

    <div class="relative z-10 pb-20 space-y-12">
      <MovieRow
        v-if="featuredMovies.length"
        title="Featured"
        :movies="featuredMovies"
        size="large"
        type="rating"
        :browse-query="{ sort: 'rating' }"
      />

      <MovieRow
        v-if="auth.isAuthenticated && watchHistory.length"
        title="Continue Watching"
        :movies="watchHistory"
        size="medium"
        type="progress"
      />

      <MovieRow
        v-if="trendingMovies.length"
        title="Trending Now"
        :movies="trendingMovies"
        size="medium"
        type="rating"
        :browse-query="{ sort: 'popular' }"
      />

      <section v-if="genres.length" class="px-6 md:px-12">
        <h2 class="text-lg md:text-xl font-semibold text-white mb-4">
          Browse by Genre
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <router-link
            v-for="genre in genreCards.slice(0, 6)"
            :key="genre.name"
            :to="{ path: '/browse', query: { genre: genre.name } }"
            class="relative overflow-hidden rounded-xl aspect-video group cursor-pointer bg-zinc-900"
          >
            <img
              v-if="genre.image"
              :src="genre.image"
              :alt="genre.name"
              class="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-red-950/80 transition-all duration-300"
            />
            <div class="absolute inset-0 flex items-end p-3">
              <span class="text-white font-bold text-sm drop-shadow-lg">{{
                genre.name
              }}</span>
            </div>
          </router-link>
        </div>
      </section>

      <MovieRow
        v-if="newMovies.length"
        title="New & Popular"
        :movies="newMovies"
        size="large"
        type="rating"
        :browse-query="{ sort: 'newest' }"
      />

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
import { tmdbService } from "../services/tmdb.service";
import HeroBanner from "../components/home/HeroBanner.vue";
import MovieRow from "../components/home/MovieRow.vue";

const genreRepresentatives = {
  Action: "Mad Max Fury Road",
  Adventure: "Indiana Jones Raiders of the Lost Ark",
  Animation: "Spider-Man Into the Spider-Verse",
  Comedy: "The Grand Budapest Hotel",
  Crime: "The Godfather",
  Documentary: "Free Solo",
  Drama: "The Shawshank Redemption",
  Fantasy: "The Lord of the Rings",
  Horror: "Get Out",
  Mystery: "Knives Out",
  Romance: "La La Land",
  "Sci-Fi": "Interstellar",
  Thriller: "Parasite",
  War: "Dunkirk",
  Western: "No Country for Old Men",
  History: "Gladiator",
  Music: "Bohemian Rhapsody",
  Family: "Coco",
  Sport: "Ford v Ferrari",
};

const auth = useAuthStore();
const loading = ref(true);
const featuredMovies = ref([]);
const trendingMovies = ref([]);
const newMovies = ref([]);
const genres = ref([]);
const genreCards = ref([]);
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
    genres.value = genreList
      .map((g) => (typeof g === "object" ? g.genre : g))
      .filter(Boolean);

    // Build genre cards with TMDB backdrops
    genreCards.value = await Promise.all(
      genres.value.map(async (name) => {
        try {
          const images = await tmdbService.getMovieImages(
            genreRepresentatives[name] || name,
            null
          );
          return { name, image: images.backdrop };
        } catch {
          return { name, image: null };
        }
      })
    );

    // Fetch watch history — get full movie objects with progress data
    if (auth.isAuthenticated) {
      const history = await streamService
        .getHistory({ limit: 10 })
        .catch(() => ({ history: [] }));
      const sessions = history.history || [];
      const moviePromises = sessions.map((session) =>
        movieService
          .getMovie(session.movieId)
          .then((movie) => ({
            ...movie,
            progress: session.percentWatched || 0,
            progressSeconds: session.progressSeconds || 0,
          }))
          .catch(() => null)
      );
      const movieData = await Promise.all(moviePromises);
      watchHistory.value = movieData.filter(Boolean);
    }
  } finally {
    loading.value = false;
  }
});
</script>