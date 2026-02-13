import User from "../models/User.js";
import Movie from "../models/Movie.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("watchlist")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, profileImage, updatedAt: Date.now() },
      { new: true, runValidators: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addToWatchlist = async (req, res) => {
  try {
    const { movieId } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    if (user.watchlist.includes(movieId)) {
      return res.status(400).json({
        success: false,
        message: "Movie already in watchlist",
      });
    }

    user.watchlist.push(movieId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Movie added to watchlist",
      data: user.watchlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.watchlist = user.watchlist.filter((id) => id.toString() !== movieId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Movie removed from watchlist",
      data: user.watchlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("watchlist");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.watchlist.length,
      data: user.watchlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addToWatchHistory = async (req, res) => {
  try {
    const { movieId, progress } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const historyIndex = user.watchHistory.findIndex(
      (item) => item.movieId.toString() === movieId,
    );

    if (historyIndex !== -1) {
      user.watchHistory[historyIndex].progress = progress;
      user.watchHistory[historyIndex].watchedAt = Date.now();
    } else {
      user.watchHistory.push({
        movieId,
        progress,
        watchedAt: Date.now(),
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Watch history updated",
      data: user.watchHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWatchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate(
      "watchHistory.movieId",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.watchHistory.length,
      data: user.watchHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const setFavoriteGenres = async (req, res) => {
  try {
    const { genres } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { favoriteGenres: genres },
      { new: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Favorite genres updated",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
