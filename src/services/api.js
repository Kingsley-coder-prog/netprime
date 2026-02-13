// API Configuration and utility functions for NetPrime Frontend

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Store JWT token in localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("authToken", token);
  } else {
    localStorage.removeItem("authToken");
  }
};

// Get JWT token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Make API requests with auth header
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// ============ Authentication APIs ============

export const authAPI = {
  register: (name, email, password, confirmPassword) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, confirmPassword }),
    }),

  login: (email, password) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => {
    setAuthToken(null);
    return apiRequest("/auth/logout", { method: "GET" });
  },

  getCurrentUser: () => apiRequest("/auth/me", { method: "GET" }),
};

// ============ Movie APIs ============

export const movieAPI = {
  getAllMovies: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.genre) params.append("genre", filters.genre);
    if (filters.trending) params.append("trending", filters.trending);
    if (filters.popular) params.append("popular", filters.popular);
    if (filters.featured) params.append("featured", filters.featured);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);

    const queryString = params.toString();
    return apiRequest(`/movies${queryString ? "?" + queryString : ""}`, {
      method: "GET",
    });
  },

  getMovieById: (id) => apiRequest(`/movies/${id}`, { method: "GET" }),

  getFeaturedMovies: () => apiRequest("/movies/featured", { method: "GET" }),

  getTrendingMovies: () => apiRequest("/movies/trending", { method: "GET" }),

  getPopularMovies: () => apiRequest("/movies/popular", { method: "GET" }),

  createMovie: (movieData) =>
    apiRequest("/movies", {
      method: "POST",
      body: JSON.stringify(movieData),
    }),

  updateMovie: (id, movieData) =>
    apiRequest(`/movies/${id}`, {
      method: "PUT",
      body: JSON.stringify(movieData),
    }),

  deleteMovie: (id) => apiRequest(`/movies/${id}`, { method: "DELETE" }),
};

// ============ Genre APIs ============

export const genreAPI = {
  getAllGenres: () => apiRequest("/genres", { method: "GET" }),

  getGenreById: (id) => apiRequest(`/genres/${id}`, { method: "GET" }),

  getMoviesByGenre: (genreName) =>
    apiRequest(`/genres/search/${genreName}`, { method: "GET" }),

  createGenre: (genreData) =>
    apiRequest("/genres", {
      method: "POST",
      body: JSON.stringify(genreData),
    }),

  updateGenre: (id, genreData) =>
    apiRequest(`/genres/${id}`, {
      method: "PUT",
      body: JSON.stringify(genreData),
    }),

  deleteGenre: (id) => apiRequest(`/genres/${id}`, { method: "DELETE" }),
};

// ============ User APIs ============

export const userAPI = {
  getProfile: () => apiRequest("/users/profile", { method: "GET" }),

  updateProfile: (profileData) =>
    apiRequest("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  // Watchlist
  addToWatchlist: (movieId) =>
    apiRequest("/users/watchlist", {
      method: "POST",
      body: JSON.stringify({ movieId }),
    }),

  removeFromWatchlist: (movieId) =>
    apiRequest(`/users/watchlist/${movieId}`, { method: "DELETE" }),

  getWatchlist: () => apiRequest("/users/watchlist", { method: "GET" }),

  // Watch History
  addToWatchHistory: (movieId, progress = 0) =>
    apiRequest("/users/watch-history", {
      method: "POST",
      body: JSON.stringify({ movieId, progress }),
    }),

  getWatchHistory: () => apiRequest("/users/watch-history", { method: "GET" }),

  // Favorite Genres
  setFavoriteGenres: (genres) =>
    apiRequest("/users/favorite-genres", {
      method: "PUT",
      body: JSON.stringify({ genres }),
    }),
};

// ============ Helper Functions ============

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const logout = () => {
  setAuthToken(null);
  window.location.href = "/";
};
