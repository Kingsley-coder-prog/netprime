import api from "./api.service";

export const movieService = {
  async getMovies(params = {}) {
    const { data } = await api.get("/api/movies", { params });
    return data.data;
  },

  async getMovie(idOrSlug) {
    const { data } = await api.get(`/api/movies/${idOrSlug}`);
    return data.data.movie;
  },

  async searchMovies(query, params = {}) {
    const { data } = await api.get("/api/movies/search", {
      params: { q: query, ...params },
    });
    return data.data;
  },

  async getFeaturedMovies() {
    const { data } = await api.get("/api/movies/featured");
    return data.data.movies;
  },

  async getTrendingMovies() {
    const { data } = await api.get("/api/movies/trending");
    return data.data.movies;
  },

  async getGenres() {
    const { data } = await api.get("/api/movies/genres");
    return data.data.genres;
  },

  async getReviews(movieId, params = {}) {
    const { data } = await api.get(`/api/movies/${movieId}/reviews`, {
      params,
    });
    return data.data;
  },

  async addReview(movieId, payload) {
    const { data } = await api.post(`/api/movies/${movieId}/reviews`, payload);
    return data.data.review;
  },

  async deleteReview(movieId, reviewId) {
    await api.delete(`/api/movies/${movieId}/reviews/${reviewId}`);
  },

  // Admin
  async createMovie(payload) {
    const { data } = await api.post("/api/movies", payload);
    return data.data.movie;
  },

  async updateMovie(id, payload) {
    const { data } = await api.patch(`/api/movies/${id}`, payload);
    return data.data.movie;
  },

  async deleteMovie(id) {
    const { data } = await api.delete(`/api/movies/${id}`);
    return data;
  },
};
