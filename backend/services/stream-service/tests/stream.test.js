"use strict";

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const WatchSession = require("../models/WatchSession");

// Mock external service calls so tests are self-contained
jest.mock("../controllers/stream.controller", () => {
  const actual = jest.requireActual("../controllers/stream.controller");
  return actual;
});

jest.mock("axios", () => ({
  get: jest.fn(),
}));

jest.mock("../utils/cdn", () => ({
  buildStreamManifest: jest.fn().mockResolvedValue([
    {
      quality: "720p",
      url: "https://cdn.example.com/hls/uuid/720p/index.m3u8?token=abc",
      duration: 7200,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
  ]),
  generateSignedStreamUrl: jest
    .fn()
    .mockResolvedValue("https://cdn.example.com/signed"),
}));

const axios = require("axios");
const USER_ID = new mongoose.Types.ObjectId().toString();
const MOVIE_ID = new mongoose.Types.ObjectId().toString();

const AUTH_HEADERS = { "x-user-id": USER_ID, "x-user-role": "user" };
const ADMIN_HEADERS = {
  "x-user-id": new mongoose.Types.ObjectId().toString(),
  "x-user-role": "admin",
};

const mockMovie = {
  _id: MOVIE_ID,
  title: "Inception",
  status: "published",
  isFree: false,
  requiredPlan: "basic",
  videoFiles: [
    { quality: "720p", s3Key: "hls/uuid/720p/index.m3u8", duration: 7200 },
  ],
};

const mockSubscription = { plan: "basic", expiresAt: null };

beforeAll(() => {
  process.env.NODE_ENV = "test";
});
afterAll(async () => {
  await mongoose.connection.close();
});
afterEach(async () => {
  await WatchSession.deleteMany({});
  jest.clearAllMocks();
});

// ============================================================

describe("GET /api/stream/:movieId", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/movies/"))
        return Promise.resolve({ data: { data: { movie: mockMovie } } });
      if (url.includes("/subscription"))
        return Promise.resolve({
          data: { data: { subscription: mockSubscription } },
        });
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it("returns signed stream URLs for authorised user", async () => {
    const res = await request(app)
      .get(`/api/stream/${MOVIE_ID}`)
      .set(AUTH_HEADERS);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.streams).toHaveLength(1);
    expect(res.body.data.streams[0]).toHaveProperty("url");
    expect(res.body.data.streams[0].quality).toBe("720p");
  });

  it("creates a WatchSession on first play", async () => {
    await request(app).get(`/api/stream/${MOVIE_ID}`).set(AUTH_HEADERS);
    const session = await WatchSession.findOne({
      userId: USER_ID,
      movieId: MOVIE_ID,
    });
    expect(session).not.toBeNull();
  });

  it("returns 401 without auth headers", async () => {
    const res = await request(app).get(`/api/stream/${MOVIE_ID}`);
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when plan is insufficient", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/movies/"))
        return Promise.resolve({
          data: { data: { movie: { ...mockMovie, requiredPlan: "premium" } } },
        });
      if (url.includes("/subscription"))
        return Promise.resolve({
          data: { data: { subscription: { plan: "free" } } },
        });
    });

    const res = await request(app)
      .get(`/api/stream/${MOVIE_ID}`)
      .set(AUTH_HEADERS);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/premium/);
  });
});

describe("POST /api/stream/:movieId/progress", () => {
  it("saves watch progress", async () => {
    const res = await request(app)
      .post(`/api/stream/${MOVIE_ID}/progress`)
      .set(AUTH_HEADERS)
      .send({ progressSeconds: 300, durationSeconds: 7200, quality: "720p" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/stream/:movieId/progress", () => {
  it("returns zero progress for first-time viewer", async () => {
    const res = await request(app)
      .get(`/api/stream/${MOVIE_ID}/progress`)
      .set(AUTH_HEADERS);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.progressSeconds).toBe(0);
  });

  it("returns saved progress after watching", async () => {
    await request(app)
      .post(`/api/stream/${MOVIE_ID}/progress`)
      .set(AUTH_HEADERS)
      .send({ progressSeconds: 600, durationSeconds: 7200, quality: "720p" });

    const res = await request(app)
      .get(`/api/stream/${MOVIE_ID}/progress`)
      .set(AUTH_HEADERS);

    expect(res.body.data.progressSeconds).toBe(600);
  });
});

describe("GET /api/stream/history", () => {
  it("returns user watch history", async () => {
    await WatchSession.create({
      userId: USER_ID,
      movieId: MOVIE_ID,
      progressSeconds: 120,
      durationSeconds: 7200,
      sessionToken: "abc123",
    });

    const res = await request(app).get("/api/stream/history").set(AUTH_HEADERS);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.history).toHaveLength(1);
  });
});
