import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  addToWatchHistory,
  getWatchHistory,
  setFavoriteGenres,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.post("/watchlist", protect, addToWatchlist);
router.delete("/watchlist/:movieId", protect, removeFromWatchlist);
router.get("/watchlist", protect, getWatchlist);
router.post("/watch-history", protect, addToWatchHistory);
router.get("/watch-history", protect, getWatchHistory);
router.put("/favorite-genres", protect, setFavoriteGenres);

export default router;
