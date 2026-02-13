import mongoose from "mongoose";

const genreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: null,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  movies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Genre = mongoose.model("Genre", genreSchema);

export default Genre;
