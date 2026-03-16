"use strict";

const Movie = require("../models/Movie");
const Review = require("../models/Review");
const { getRedisClient } = require("../../../shared/redis");
const { createServiceLogger } = require("../../../shared/logger");
const {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} = require("../../../shared/errors");

const logger = createServiceLogger("movie-service");
const CACHE_TTL = 300; // 5 minutes

// ---- Cache helpers ----

const cacheGet = async (key) => {
  try {
    const redis = getRedisClient();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const cacheSet = async (key, data, ttl = CACHE_TTL) => {
  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch {
    /* non-fatal */
  }
};

const cacheDel = async (...keys) => {
  try {
    const redis = getRedisClient();
    await redis.del(...keys);
  } catch {
    /* non-fatal */
  }
};

const invalidateMovieCache = async (movieId, slug) => {
  await cacheDel(
    `movie:${movieId}`,
    `movie:${slug}`,
    "movies:featured",
    "movies:genres",
  );
  // Flush paginated list caches (pattern delete)
  try {
    const redis = getRedisClient();
    const keys = await redis.keys("movies:list:*");
    if (keys.length) await redis.del(...keys);
  } catch {
    /* non-fatal */
  }
};

// ---- Build sort option from query param ----
const buildSort = (sort) => {
  const sorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    rating: { "rating.average": -1 },
    popular: { viewCount: -1 },
    title: { title: 1 },
  };
  return sorts[sort] || sorts.newest;
};

// ============================================================
//  MOVIE CRUD
// ============================================================

/**
 * GET /api/movies
 * Public. Supports filtering, sorting, full-text search, pagination.
 */
const getMovies = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      sort,
      genre,
      year,
      language,
      ageRating,
      search,
      isFeatured,
      isFree,
      status,
    } = req.query;

    const cacheKey = `movies:list:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    // Build query
    const filter = {};
    const isAdmin = req.headers["x-user-role"] === "admin";

    // Non-admins only see published movies
    if (!isAdmin) {
      filter.status = "published";
    } else if (status) {
      filter.status = status;
    }

    if (genre) filter.genres = genre;
    if (year) filter.releaseYear = Number(year);
    if (language) filter.language = new RegExp(language, "i");
    if (ageRating) filter.ageRating = ageRating;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (isFree !== undefined) filter.isFree = isFree;

    // Full-text search (uses $text index)
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const sortBy = buildSort(sort);

    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .sort(search ? { score: { $meta: "textScore" } } : sortBy)
        .skip(skip)
        .limit(limit)
        .select("-videoFiles -__v") // Don't expose internal S3 keys publicly
        .lean(),
      Movie.countDocuments(filter),
    ]);

    const result = {
      success: true,
      data: {
        movies,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };

    await cacheSet(cacheKey, result, 120); // 2 min cache for lists
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/movies/featured
 * Returns featured movies (for hero section of frontend).
 */
const getFeaturedMovies = async (req, res, next) => {
  try {
    const cached = await cacheGet("movies:featured");
    if (cached) return res.json(cached);

    const movies = await Movie.find({ status: "published", isFeatured: true })
      .sort({ "rating.average": -1 })
      .limit(10)
      .select("-videoFiles -__v")
      .lean();

    const result = { success: true, data: { movies } };
    await cacheSet("movies:featured", result, 600); // 10 min cache
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/movies/genres
 * Returns all genres with movie counts.
 */
const getGenres = async (req, res, next) => {
  try {
    const cached = await cacheGet("movies:genres");
    if (cached) return res.json(cached);

    const genres = await Movie.aggregate([
      { $match: { status: "published" } },
      { $unwind: "$genres" },
      { $group: { _id: "$genres", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { genre: "$_id", count: 1, _id: 0 } },
    ]);

    const result = { success: true, data: { genres } };
    await cacheSet("movies:genres", result, 3600); // 1 hour cache
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/movies/trending
 * Most viewed in the last 7 days. Uses viewCount as proxy (could use analytics).
 */
const getTrendingMovies = async (req, res, next) => {
  try {
    const cached = await cacheGet("movies:trending");
    if (cached) return res.json(cached);

    const movies = await Movie.find({ status: "published" })
      .sort({ viewCount: -1 })
      .limit(20)
      .select("-videoFiles -__v")
      .lean();

    const result = { success: true, data: { movies } };
    await cacheSet("movies:trending", result, 300);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/movies/:idOrSlug
 * Accepts either MongoDB ObjectId or URL slug.
 */
const getMovie = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const cacheKey = `movie:${idOrSlug}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const isId = /^[a-f\d]{24}$/i.test(idOrSlug);
    const filter = isId ? { _id: idOrSlug } : { slug: idOrSlug };
    const isAdmin = req.headers["x-user-role"] === "admin";

    if (!isAdmin) filter.status = "published";

    const movie = await Movie.findOne(filter)
      .select("-videoFiles") // videoFiles exposed only via stream-service
      .lean();

    if (!movie) throw new NotFoundError("Movie");

    // Increment view count asynchronously (non-blocking)
    Movie.findByIdAndUpdate(movie._id, { $inc: { viewCount: 1 } }).exec();

    const result = { success: true, data: { movie } };
    await cacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/movies
 * Admin only.
 */
const createMovie = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const movie = await Movie.create({ ...req.body, uploadedBy: userId });

    logger.info(`Movie created: "${movie.title}" by user ${userId}`);
    await invalidateMovieCache(movie._id, movie.slug);

    res.status(201).json({ success: true, data: { movie } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/movies/:id
 * Admin only.
 */
const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) throw new NotFoundError("Movie");

    Object.assign(movie, req.body);
    await movie.save();

    logger.info(`Movie updated: "${movie.title}"`);
    await invalidateMovieCache(movie._id, movie.slug);

    res.json({ success: true, data: { movie } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/movies/:id/status
 * Admin only. Publishes / archives a movie.
 */
const updateMovieStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );
    if (!movie) throw new NotFoundError("Movie");

    logger.info(`Movie "${movie.title}" status changed to ${status}`);
    await invalidateMovieCache(movie._id, movie.slug);

    res.json({ success: true, data: { movie } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/movies/:id
 * Admin only. Soft-delete by archiving.
 */
const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { status: "archived" },
      { new: true },
    );
    if (!movie) throw new NotFoundError("Movie");

    logger.info(`Movie "${movie.title}" archived (soft-deleted)`);
    await invalidateMovieCache(movie._id, movie.slug);

    res.json({ success: true, message: "Movie archived successfully" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  REVIEWS
// ============================================================

/**
 * GET /api/movies/:id/reviews
 */
const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ movie: req.params.id })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments({ movie: req.params.id }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/movies/:id/reviews
 * Authenticated users only.
 */
const createReview = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const movieId = req.params.id;

    const movie = await Movie.findById(movieId);
    if (!movie || movie.status !== "published")
      throw new NotFoundError("Movie");

    // Check for existing review
    const existing = await Review.findOne({ movie: movieId, user: userId });
    if (existing)
      throw new ConflictError("You have already reviewed this movie");

    const review = await Review.create({
      movie: movieId,
      user: userId,
      ...req.body,
    });

    // Populate user for response
    await review.populate("user", "name avatar");

    res.status(201).json({ success: true, data: { review } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/movies/:id/reviews/:reviewId
 * Owner only.
 */
const updateReview = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const review = await Review.findById(req.params.reviewId);
    if (!review) throw new NotFoundError("Review");

    if (review.user.toString() !== userId) {
      throw new AuthorizationError("You can only edit your own reviews");
    }

    Object.assign(review, req.body);
    await review.save();
    await review.populate("user", "name avatar");

    res.json({ success: true, data: { review } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/movies/:id/reviews/:reviewId
 * Owner or admin.
 */
const deleteReview = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const isAdmin = req.headers["x-user-role"] === "admin";
    const review = await Review.findById(req.params.reviewId);
    if (!review) throw new NotFoundError("Review");

    if (!isAdmin && review.user.toString() !== userId) {
      throw new AuthorizationError("You can only delete your own reviews");
    }

    await review.deleteOne();
    // updateMovieRating is triggered by post-remove hook on Review model

    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
//  SEARCH (dedicated endpoint — uses MongoDB $text index)
// ============================================================

/**
 * GET /api/movies/search?q=batman
 */
const searchMovies = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: { movies: [], pagination: { total: 0 } },
      });
    }

    const skip = (page - 1) * limit;
    const filter = {
      $text: { $search: q.trim() },
      status: "published",
    };

    const [movies, total] = await Promise.all([
      Movie.find(filter, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(Number(limit))
        .select("-videoFiles -__v")
        .lean(),
      Movie.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        movies,
        query: q,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
          hasNext: Number(page) < Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /:id/video-files
 * Internal only — called by transcoder worker after HLS transcoding completes.
 */
const updateVideoFiles = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) throw new NotFoundError("Movie");

    const { videoFiles } = req.body;
    movie.videoFiles = videoFiles;
    if (movie.status === "processing") movie.status = "published";
    await movie.save();

    await invalidateMovieCache(movie._id, movie.slug);
    logger.info(`Video files updated for movie ${movie._id}`);

    res.json({ success: true, data: { movie } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMovies,
  getFeaturedMovies,
  getGenres,
  getTrendingMovies,
  getMovie,
  createMovie,
  updateMovie,
  updateMovieStatus,
  deleteMovie,
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  searchMovies,
  updateVideoFiles,
};
