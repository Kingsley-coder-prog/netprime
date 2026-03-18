import axios from "axios";

const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  headers: {
    Authorization: `Bearer ${TMDB_TOKEN}`,
  },
});

// Simple in-memory cache to avoid redundant requests
const cache = new Map();

export const tmdbService = {
  posterUrl(path, size = "w500") {
    if (!path) return null;
    return `${IMG_BASE}/${size}${path}`;
  },

  backdropUrl(path, size = "w1280") {
    if (!path) return null;
    return `${IMG_BASE}/${size}${path}`;
  },

  async searchMovie(title, year) {
    const key = `${title}-${year}`;
    if (cache.has(key)) return cache.get(key);

    try {
      const { data } = await tmdb.get("/search/movie", {
        params: { query: title, year, language: "en-US", page: 1 },
      });
      const result = data.results?.[0] || null;
      cache.set(key, result);
      return result;
    } catch {
      return null;
    }
  },

  async getMovieImages(title, year) {
    const movie = await this.searchMovie(title, year);
    if (!movie) return { poster: null, backdrop: null };

    return {
      poster: this.posterUrl(movie.poster_path, "w500"),
      backdrop: this.backdropUrl(movie.backdrop_path, "w1280"),
      posterOriginal: this.posterUrl(movie.poster_path, "original"),
    };
  },
};
