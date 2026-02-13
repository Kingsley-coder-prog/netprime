// Example: How to use the API in Vue components

import { ref } from "vue";
import {
  authAPI,
  movieAPI,
  userAPI,
  genreAPI,
  setAuthToken,
  getAuthToken,
} from "@/services/api.js";

// ============================================
// EXAMPLE 1: Authentication Component
// ============================================

export const useAuth = () => {
  const user = ref(null);
  const token = ref(getAuthToken());
  const loading = ref(false);
  const error = ref(null);

  const register = async (name, email, password, confirmPassword) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await authAPI.register(
        name,
        email,
        password,
        confirmPassword,
      );
      setAuthToken(response.token);
      token.value = response.token;
      user.value = response.user;
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const login = async (email, password) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await authAPI.login(email, password);
      setAuthToken(response.token);
      token.value = response.token;
      user.value = response.user;
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    setAuthToken(null);
    token.value = null;
    user.value = null;
  };

  const getCurrentUser = async () => {
    try {
      if (!token.value) return;
      const response = await authAPI.getCurrentUser();
      user.value = response.user;
      return response;
    } catch (err) {
      console.error(err);
    }
  };

  return {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    getCurrentUser,
  };
};

// ============================================
// EXAMPLE 2: Movies Component
// ============================================

export const useMovies = () => {
  const movies = ref([]);
  const featured = ref(null);
  const trending = ref([]);
  const popular = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchAllMovies = async (filters = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await movieAPI.getAllMovies(filters);
      movies.value = response.data;
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchFeaturedMovies = async () => {
    try {
      const response = await movieAPI.getFeaturedMovies();
      featured.value = response.data[0]; // Get first featured
      return response;
    } catch (err) {
      error.value = err.message;
    }
  };

  const fetchTrendingMovies = async () => {
    try {
      const response = await movieAPI.getTrendingMovies();
      trending.value = response.data;
      return response;
    } catch (err) {
      error.value = err.message;
    }
  };

  const fetchPopularMovies = async () => {
    try {
      const response = await movieAPI.getPopularMovies();
      popular.value = response.data;
      return response;
    } catch (err) {
      error.value = err.message;
    }
  };

  const getMovieById = async (id) => {
    try {
      return await movieAPI.getMovieById(id);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const searchMovies = async (query) => {
    return fetchAllMovies({ search: query });
  };

  const filterByGenre = async (genre) => {
    return fetchAllMovies({ genre });
  };

  return {
    movies,
    featured,
    trending,
    popular,
    loading,
    error,
    fetchAllMovies,
    fetchFeaturedMovies,
    fetchTrendingMovies,
    fetchPopularMovies,
    getMovieById,
    searchMovies,
    filterByGenre,
  };
};

// ============================================
// EXAMPLE 3: User/Watchlist Component
// ============================================

export const useUserWatchlist = () => {
  const watchlist = ref([]);
  const watchHistory = ref([]);
  const userProfile = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchProfile = async () => {
    try {
      loading.value = true;
      const response = await userAPI.getProfile();
      userProfile.value = response.data;
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await userAPI.getWatchlist();
      watchlist.value = response.data;
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const addToWatchlist = async (movieId) => {
    try {
      const response = await userAPI.addToWatchlist(movieId);
      watchlist.value = response.data;
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const removeFromWatchlist = async (movieId) => {
    try {
      const response = await userAPI.removeFromWatchlist(movieId);
      watchlist.value = response.data;
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const isInWatchlist = (movieId) => {
    return watchlist.value.some((movie) => movie._id === movieId);
  };

  const recordWatchHistory = async (movieId, progress = 0) => {
    try {
      return await userAPI.addToWatchHistory(movieId, progress);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const fetchWatchHistory = async () => {
    try {
      const response = await userAPI.getWatchHistory();
      watchHistory.value = response.data;
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    watchlist,
    watchHistory,
    userProfile,
    loading,
    error,
    fetchProfile,
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    recordWatchHistory,
    fetchWatchHistory,
  };
};

// ============================================
// EXAMPLE 4: Genres Component
// ============================================

export const useGenres = () => {
  const genres = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchAllGenres = async () => {
    try {
      loading.value = true;
      error.value = null;
      const response = await genreAPI.getAllGenres();
      genres.value = response.data;
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getMoviesByGenre = async (genreName) => {
    try {
      return await genreAPI.getMoviesByGenre(genreName);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    genres,
    loading,
    error,
    fetchAllGenres,
    getMoviesByGenre,
  };
};

// ============================================
// EXAMPLE 5: Using in Vue Component
// ============================================

/*
<template>
  <div>
    <h1>Movies</h1>
    
    <!-- Search -->
    <input 
      v-model="searchQuery" 
      placeholder="Search movies..."
      @input="handleSearch"
    />

    <!-- Movies Grid -->
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="movies-grid">
      <div 
        v-for="movie in movies" 
        :key="movie._id" 
        class="movie-card"
      >
        <img :src="movie.imageUrl" :alt="movie.title" />
        <h3>{{ movie.title }}</h3>
        <button @click="addToMyWatchlist(movie._id)">
          {{ isInWatchlist(movie._id) ? 'Remove' : 'Add' }} to Watchlist
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMovies, useUserWatchlist } from '@/composables/api.js';

const { movies, loading, error, fetchAllMovies, searchMovies } = useMovies();
const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useUserWatchlist();

const searchQuery = ref('');

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    await searchMovies(searchQuery.value);
  } else {
    await fetchAllMovies();
  }
};

const addToMyWatchlist = async (movieId) => {
  if (isInWatchlist(movieId)) {
    await removeFromWatchlist(movieId);
  } else {
    await addToWatchlist(movieId);
  }
};

// Initial load
fetchAllMovies();
</script>
*/

// ============================================
// EXAMPLE 6: Login Flow
// ============================================

/*
const { user, login, loading, error } = useAuth();

const handleLogin = async (email, password) => {
  try {
    await login(email, password);
    // Redirect to home page
    router.push('/');
  } catch (err) {
    // Error shown in template via error.value
  }
};
*/

// ============================================
// EXAMPLE 7: Admin - Create Movie
// ============================================

/*
const createNewMovie = async () => {
  try {
    const movieData = {
      title: 'New Movie',
      description: 'Description here',
      imageUrl: 'https://image-url.jpg',
      genres: ['genre_id_1', 'genre_id_2'],
      year: 2024,
      rating: 8.5,
      duration: 150,
      director: 'Director Name',
      cast: ['Actor 1', 'Actor 2'],
      contentRating: 'PG-13',
      featured: false,
      trending: true,
      popular: true,
    };

    const response = await movieAPI.createMovie(movieData);
    console.log('Movie created:', response);
  } catch (err) {
    console.error('Error creating movie:', err);
  }
};
*/

export default {
  useAuth,
  useMovies,
  useUserWatchlist,
  useGenres,
};
