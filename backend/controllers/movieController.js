import Movie from "../models/Movie.js";
import Genre from "../models/Genre.js";

export const getAllMovies = async (req, res) => {
  try {
    const { search, genre, trending, popular, featured, sortBy } = req.query;
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (genre) {
      const genreDoc = await Genre.findOne({ name: genre });
      if (genreDoc) {
        query.genres = genreDoc._id;
      }
    }

    if (trending === "true") {
      query.trending = true;
    }

    if (popular === "true") {
      query.popular = true;
    }

    if (featured === "true") {
      query.featured = true;
    }

    let movies = Movie.find(query).populate("genres");

    if (sortBy === "rating") {
      movies = movies.sort({ rating: -1 });
    } else if (sortBy === "latest") {
      movies = movies.sort({ releaseDate: -1 });
    } else if (sortBy === "popular") {
      movies = movies.sort({ popular: -1 });
    }

    const result = await movies;

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate("genres");

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      imageUrl,
      bannerImageUrl,
      genres,
      year,
      rating,
      duration,
      seasons,
      episodes,
      director,
      cast,
      contentRating,
      featured,
      trending,
      popular,
      videoUrl,
      tags,
    } = req.body;

    if (!title || !description || !imageUrl || !year) {
      return res.status(400).json({
        success: false,
        message: "Please provide required fields",
      });
    }

    const movie = await Movie.create({
      title,
      description,
      imageUrl,
      bannerImageUrl,
      genres,
      year,
      rating,
      duration,
      seasons,
      episodes,
      director,
      cast,
      contentRating,
      featured,
      trending,
      popular,
      videoUrl,
      tags,
    });

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMovie = async (req, res) => {
  try {
    let movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFeaturedMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ featured: true }).populate("genres");

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTrendingMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ trending: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("genres");

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPopularMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ popular: true })
      .sort({ rating: -1 })
      .limit(10)
      .populate("genres");

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
