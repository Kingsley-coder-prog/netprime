"use strict";

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/movie.controller");
const {
  validate,
  createMovieSchema,
  updateMovieSchema,
  updateStatusSchema,
  createReviewSchema,
  updateReviewSchema,
  movieQuerySchema,
} = require("../validators/movie.validator");
const { globalLimiter } = require("../../../shared/redis/rateLimiter");

// Lightweight role-check middleware (trusts X-User-Role from gateway)
const requireAdmin = (req, res, next) => {
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({
      success: false,
      code: "AUTHORIZATION_ERROR",
      message: "Admin access required",
    });
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.headers["x-user-id"]) {
    return res.status(401).json({
      success: false,
      code: "AUTHENTICATION_ERROR",
      message: "Authentication required",
    });
  }
  next();
};

router.use(globalLimiter);

// ---- Discovery routes (public) ----
router.get("/search", validate(movieQuerySchema), ctrl.searchMovies);
router.get("/featured", ctrl.getFeaturedMovies);
router.get("/trending", ctrl.getTrendingMovies);
router.get("/genres", ctrl.getGenres);
router.get("/", validate(movieQuerySchema), ctrl.getMovies);
router.get("/:idOrSlug", ctrl.getMovie);

// ---- Admin: Movie CRUD ----
router.post("/", requireAdmin, validate(createMovieSchema), ctrl.createMovie);
router.patch(
  "/:id",
  requireAdmin,
  validate(updateMovieSchema),
  ctrl.updateMovie,
);
router.patch(
  "/:id/status",
  requireAdmin,
  validate(updateStatusSchema),
  ctrl.updateMovieStatus,
);
router.delete("/:id", requireAdmin, ctrl.deleteMovie);

// ---- Reviews (authenticated users) ----
router.get("/:id/reviews", ctrl.getReviews);
router.post(
  "/:id/reviews",
  requireAuth,
  validate(createReviewSchema),
  ctrl.createReview,
);
router.patch(
  "/:id/reviews/:reviewId",
  requireAuth,
  validate(updateReviewSchema),
  ctrl.updateReview,
);
router.delete("/:id/reviews/:reviewId", requireAuth, ctrl.deleteReview);

module.exports = router;
