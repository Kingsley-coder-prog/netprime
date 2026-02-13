import Genre from "../models/Genre.js";
import Movie from "../models/Movie.js";

export const getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.find().populate("movies");

    res.status(200).json({
      success: true,
      count: genres.length,
      data: genres,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGenreById = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id).populate("movies");

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    res.status(200).json({
      success: true,
      data: genre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createGenre = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Please provide genre name",
      });
    }

    const genre = await Genre.create({
      name,
      description,
      imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Genre created successfully",
      data: genre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateGenre = async (req, res) => {
  try {
    let genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    genre = await Genre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Genre updated successfully",
      data: genre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteGenre = async (req, res) => {
  try {
    const genre = await Genre.findByIdAndDelete(req.params.id);

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Genre deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMoviesByGenre = async (req, res) => {
  try {
    const { genreName } = req.params;

    const genre = await Genre.findOne({ name: genreName }).populate("movies");

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    const movies = await Movie.find({ genres: genre._id }).populate("genres");

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
