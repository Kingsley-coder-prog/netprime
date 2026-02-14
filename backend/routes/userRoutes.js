const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  addToWatchHistory,
  getWatchHistory,
  setFavoriteGenres,
} = require("../controllers/userController.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.post("/watchlist", protect, addToWatchlist);
router.delete("/watchlist/:movieId", protect, removeFromWatchlist);
router.get("/watchlist", protect, getWatchlist);
router.post("/watch-history", protect, addToWatchHistory);
router.get("/watch-history", protect, getWatchHistory);
router.put("/favorite-genres", protect, setFavoriteGenres);

module.exports = router;
