"use strict";

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const User = require("../models/User");

beforeAll(async () => {
  // index.js calls connectDB which uses MONGO_URI_TEST in test env
  process.env.NODE_ENV = "test";
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

const testUser = {
  name: "Test User",
  email: "test@cinemax.com",
  password: "Password1",
  confirmPassword: "Password1",
};

describe("POST /api/auth/register", () => {
  it("should register a new user and return 201", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it("should return 409 if email already exists", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.statusCode).toBe(409);
  });

  it("should return 400 for missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "bad@test.com" });
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(testUser);
  });

  it("should login with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
  });

  it("should return 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "WrongPass1" });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("should return user profile with valid token", async () => {
    const reg = await request(app).post("/api/auth/register").send(testUser);
    const { accessToken } = reg.body.data;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });
});
