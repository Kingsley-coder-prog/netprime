const express = require("express");
const {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getFeaturedMovies,
  getTrendingMovies,
  getPopularMovies,
} = require("../controllers/movieController.js");
const router = express.Router();

router.get("/", getAllMovies);
router.get("/featured", getFeaturedMovies);
router.get("/trending", getTrendingMovies);
router.get("/popular", getPopularMovies);
router.get("/:id", getMovieById);
router.post("/", createMovie);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);

module.exports = router;
