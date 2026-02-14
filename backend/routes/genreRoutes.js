const express = require("express");
const {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
  getMoviesByGenre,
} = require("../controllers/genreController.js");

const router = express.Router();

router.get("/", getAllGenres);
router.get("/:id", getGenreById);
router.post("/", createGenre);
router.put("/:id", updateGenre);
router.delete("/:id", deleteGenre);
router.get("/search/:genreName", getMoviesByGenre);

module.exports = router;
