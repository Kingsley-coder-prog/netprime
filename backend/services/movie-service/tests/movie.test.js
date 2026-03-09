"use strict";

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const Movie = require("../models/Movie");
const Review = require("../models/Review");

const ADMIN_HEADERS = {
  "x-user-id": new mongoose.Types.ObjectId().toString(),
  "x-user-role": "admin",
};
const USER_HEADERS = {
  "x-user-id": new mongoose.Types.ObjectId().toString(),
  "x-user-role": "user",
};

const sampleMovie = {
  title: "The Dark Knight",
  description:
    "Batman raises the stakes in his war on crime, facing the Joker.",
  genres: ["Action", "Crime", "Drama"],
  releaseYear: 2008,
  duration: 152,
  ageRating: "PG-13",
  director: "Christopher Nolan",
};

beforeAll(() => {
  process.env.NODE_ENV = "test";
});
afterAll(async () => {
  await mongoose.connection.close();
});
afterEach(async () => {
  await Movie.deleteMany({});
  await Review.deleteMany({});
});

// Helper to create a published movie
const createPublishedMovie = async () => {
  const uploadedBy = new mongoose.Types.ObjectId();
  const movie = await Movie.create({
    ...sampleMovie,
    status: "published",
    uploadedBy,
  });
  return movie;
};

describe("GET /api/movies", () => {
  it("returns empty list when no movies", async () => {
    const res = await request(app).get("/api/movies");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.movies).toHaveLength(0);
  });

  it("returns only published movies to public users", async () => {
    await createPublishedMovie();
    const uploadedBy = new mongoose.Types.ObjectId();
    await Movie.create({
      ...sampleMovie,
      title: "Draft Movie",
      status: "draft",
      uploadedBy,
    });

    const res = await request(app).get("/api/movies");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.movies).toHaveLength(1);
    expect(res.body.data.movies[0].title).toBe("The Dark Knight");
  });

  it("returns all movies to admin", async () => {
    await createPublishedMovie();
    const uploadedBy = new mongoose.Types.ObjectId();
    await Movie.create({
      ...sampleMovie,
      title: "Draft Movie",
      status: "draft",
      uploadedBy,
    });

    const res = await request(app).get("/api/movies").set(ADMIN_HEADERS);
    expect(res.body.data.movies).toHaveLength(2);
  });
});

describe("GET /api/movies/:idOrSlug", () => {
  it("returns movie by slug", async () => {
    const movie = await createPublishedMovie();
    const res = await request(app).get(`/api/movies/${movie.slug}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.movie.title).toBe("The Dark Knight");
  });

  it("returns 404 for non-existent movie", async () => {
    const res = await request(app).get("/api/movies/non-existent-slug");
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /api/movies (admin only)", () => {
  it("creates movie when admin", async () => {
    const res = await request(app)
      .post("/api/movies")
      .set(ADMIN_HEADERS)
      .send(sampleMovie);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.movie.title).toBe("The Dark Knight");
    expect(res.body.data.movie.slug).toBe("the-dark-knight-2008");
  });

  it("returns 403 for non-admin", async () => {
    const res = await request(app)
      .post("/api/movies")
      .set(USER_HEADERS)
      .send(sampleMovie);
    expect(res.statusCode).toBe(403);
  });

  it("returns 400 for invalid data", async () => {
    const res = await request(app)
      .post("/api/movies")
      .set(ADMIN_HEADERS)
      .send({ title: "Missing fields" });
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/movies/featured", () => {
  it("returns featured movies", async () => {
    const uploadedBy = new mongoose.Types.ObjectId();
    await Movie.create({
      ...sampleMovie,
      status: "published",
      isFeatured: true,
      uploadedBy,
    });
    await Movie.create({
      ...sampleMovie,
      title: "Not Featured",
      status: "published",
      uploadedBy,
    });

    const res = await request(app).get("/api/movies/featured");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.movies).toHaveLength(1);
  });
});

describe("POST /api/movies/:id/reviews", () => {
  it("creates a review for authenticated user", async () => {
    const movie = await createPublishedMovie();
    const res = await request(app)
      .post(`/api/movies/${movie._id}/reviews`)
      .set(USER_HEADERS)
      .send({ rating: 9, body: "Masterpiece!" });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.review.rating).toBe(9);
  });

  it("prevents duplicate reviews", async () => {
    const movie = await createPublishedMovie();
    await request(app)
      .post(`/api/movies/${movie._id}/reviews`)
      .set(USER_HEADERS)
      .send({ rating: 9 });

    const res = await request(app)
      .post(`/api/movies/${movie._id}/reviews`)
      .set(USER_HEADERS)
      .send({ rating: 7 });

    expect(res.statusCode).toBe(409);
  });
});
