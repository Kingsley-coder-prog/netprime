"use strict";

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const UserProfile = require("../models/UserProfile");

const USER_ID = new mongoose.Types.ObjectId();
const ADMIN_ID = new mongoose.Types.ObjectId();
const MOVIE_ID = new mongoose.Types.ObjectId();

const AUTH_HEADERS = { "x-user-id": USER_ID.toString(), "x-user-role": "user" };
const ADMIN_HEADERS = {
  "x-user-id": ADMIN_ID.toString(),
  "x-user-role": "admin",
};

const seedUser = async (id = USER_ID) => {
  return UserProfile.create({
    _id: id,
    name: "Test User",
    email: "test@cinemax.com",
    role: "user",
  });
};

beforeAll(() => {
  process.env.NODE_ENV = "test";
});
afterAll(async () => {
  await mongoose.connection.close();
});
afterEach(async () => {
  await UserProfile.deleteMany({});
});

// ============================================================

describe("POST /api/users/provision", () => {
  it("creates a user profile", async () => {
    const res = await request(app).post("/api/users/provision").send({
      userId: USER_ID.toString(),
      name: "New User",
      email: "new@test.com",
      role: "user",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.name).toBe("New User");
  });

  it("is idempotent — does not fail if profile already exists", async () => {
    await seedUser();
    const res = await request(app).post("/api/users/provision").send({
      userId: USER_ID.toString(),
      name: "Test User",
      email: "test@cinemax.com",
      role: "user",
    });

    expect(res.statusCode).toBe(200);
  });
});

describe("GET /api/users/me", () => {
  it("returns own profile", async () => {
    await seedUser();
    const res = await request(app).get("/api/users/me").set(AUTH_HEADERS);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe("test@cinemax.com");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.statusCode).toBe(401);
  });
});

describe("PATCH /api/users/me", () => {
  it("updates profile fields", async () => {
    await seedUser();
    const res = await request(app)
      .patch("/api/users/me")
      .set(AUTH_HEADERS)
      .send({ name: "Updated Name", bio: "Movie lover" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.name).toBe("Updated Name");
    expect(res.body.data.user.bio).toBe("Movie lover");
  });
});

describe("Watchlist", () => {
  beforeEach(async () => {
    await seedUser();
  });

  it("adds a movie to watchlist", async () => {
    const res = await request(app)
      .post("/api/users/me/watchlist")
      .set(AUTH_HEADERS)
      .send({ movieId: MOVIE_ID.toString() });

    expect(res.statusCode).toBe(201);
  });

  it("prevents duplicate watchlist entries", async () => {
    await request(app)
      .post("/api/users/me/watchlist")
      .set(AUTH_HEADERS)
      .send({ movieId: MOVIE_ID.toString() });
    const res = await request(app)
      .post("/api/users/me/watchlist")
      .set(AUTH_HEADERS)
      .send({ movieId: MOVIE_ID.toString() });
    expect(res.statusCode).toBe(409);
  });

  it("removes a movie from watchlist", async () => {
    await request(app)
      .post("/api/users/me/watchlist")
      .set(AUTH_HEADERS)
      .send({ movieId: MOVIE_ID.toString() });
    const res = await request(app)
      .delete(`/api/users/me/watchlist/${MOVIE_ID}`)
      .set(AUTH_HEADERS);
    expect(res.statusCode).toBe(200);
  });
});

describe("Subscription", () => {
  it("admin can update subscription plan", async () => {
    await seedUser();
    const res = await request(app)
      .patch(`/api/users/${USER_ID}/subscription`)
      .set(ADMIN_HEADERS)
      .send({
        plan: "premium",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.subscription.plan).toBe("premium");
  });

  it("non-admin cannot update subscription", async () => {
    await seedUser();
    const res = await request(app)
      .patch(`/api/users/${USER_ID}/subscription`)
      .set(AUTH_HEADERS)
      .send({ plan: "premium" });

    expect(res.statusCode).toBe(403);
  });
});
