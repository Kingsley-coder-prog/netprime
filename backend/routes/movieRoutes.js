import express from "express";
import {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getFeaturedMovies,
  getTrendingMovies,
  getPopularMovies,
} from "../controllers/movieController.js";

const router = express.Router();

router.get("/", getAllMovies);
router.get("/featured", getFeaturedMovies);
router.get("/trending", getTrendingMovies);
router.get("/popular", getPopularMovies);
router.get("/:id", getMovieById);
router.post("/", createMovie);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);

export default router;
