"use strict";

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const Upload = require("../models/Upload");

// Mock S3 and queue utilities so tests don't need real AWS credentials
jest.mock("../utils/s3", () => ({
  generatePresignedUploadUrl: jest
    .fn()
    .mockResolvedValue("https://s3.example.com/presigned"),
  buildRawS3Key: jest.fn().mockReturnValue("raw/2024/01/user123/uuid-test.mp4"),
  objectExists: jest.fn().mockResolvedValue(true),
  deleteObject: jest.fn().mockResolvedValue(true),
}));

jest.mock("../utils/queue", () => ({
  enqueueTranscodeJob: jest.fn().mockResolvedValue({ id: "mock-job-id-123" }),
  getJobStatus: jest.fn().mockResolvedValue({ state: "active", progress: 50 }),
  closeQueue: jest.fn().mockResolvedValue(undefined),
}));

const USER_ID = new mongoose.Types.ObjectId().toString();
const MOVIE_ID = new mongoose.Types.ObjectId().toString();
const ADMIN_ID = new mongoose.Types.ObjectId().toString();

const AUTH_HEADERS = { "x-user-id": USER_ID, "x-user-role": "user" };
const ADMIN_HEADERS = { "x-user-id": ADMIN_ID, "x-user-role": "admin" };

const validPresignPayload = {
  fileName: "my-movie.mp4",
  mimeType: "video/mp4",
  sizeBytes: 500 * 1024 * 1024, // 500 MB
  movieId: MOVIE_ID,
};

beforeAll(() => {
  process.env.NODE_ENV = "test";
});
afterAll(async () => {
  await mongoose.connection.close();
});
afterEach(async () => {
  await Upload.deleteMany({});
});

// ============================================================

describe("POST /api/uploads/presigned-url", () => {
  it("returns a presigned URL for authenticated user", async () => {
    const res = await request(app)
      .post("/api/uploads/presigned-url")
      .set(AUTH_HEADERS)
      .send(validPresignPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("presignedUrl");
    expect(res.body.data).toHaveProperty("uploadId");
  });

  it("creates an Upload document with status pending", async () => {
    await request(app)
      .post("/api/uploads/presigned-url")
      .set(AUTH_HEADERS)
      .send(validPresignPayload);

    const upload = await Upload.findOne({ uploadedBy: USER_ID });
    expect(upload).not.toBeNull();
    expect(upload.status).toBe("pending");
    expect(upload.originalName).toBe("my-movie.mp4");
  });

  it("returns 401 without auth headers", async () => {
    const res = await request(app)
      .post("/api/uploads/presigned-url")
      .send(validPresignPayload);
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for invalid mimeType", async () => {
    const res = await request(app)
      .post("/api/uploads/presigned-url")
      .set(AUTH_HEADERS)
      .send({ ...validPresignPayload, mimeType: "image/jpeg" });
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 if file exceeds 4GB", async () => {
    const res = await request(app)
      .post("/api/uploads/presigned-url")
      .set(AUTH_HEADERS)
      .send({ ...validPresignPayload, sizeBytes: 5 * 1024 * 1024 * 1024 });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/uploads/confirm", () => {
  let uploadId;

  beforeEach(async () => {
    const res = await request(app)
      .post("/api/uploads/presigned-url")
      .set(AUTH_HEADERS)
      .send(validPresignPayload);
    uploadId = res.body.data.uploadId;
  });

  it("confirms upload and queues transcoding job", async () => {
    const res = await request(app)
      .post("/api/uploads/confirm")
      .set(AUTH_HEADERS)
      .send({ uploadId });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("queued");
    expect(res.body.data.jobId).toBe("mock-job-id-123");
  });

  it("returns 404 for non-existent uploadId", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post("/api/uploads/confirm")
      .set(AUTH_HEADERS)
      .send({ uploadId: fakeId });
    expect(res.statusCode).toBe(404);
  });

  it("prevents confirming another user's upload", async () => {
    const otherHeaders = {
      "x-user-id": new mongoose.Types.ObjectId().toString(),
      "x-user-role": "user",
    };
    const res = await request(app)
      .post("/api/uploads/confirm")
      .set(otherHeaders)
      .send({ uploadId });
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/uploads/:uploadId/status", () => {
  it("returns status and live progress for queued upload", async () => {
    const presignRes = await request(app)
      .post("/api/uploads/presigned-url")
      .set(AUTH_HEADERS)
      .send(validPresignPayload);
    const { uploadId } = presignRes.body.data;

    await request(app)
      .post("/api/uploads/confirm")
      .set(AUTH_HEADERS)
      .send({ uploadId });

    const res = await request(app)
      .get(`/api/uploads/${uploadId}/status`)
      .set(AUTH_HEADERS);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("queued");
    expect(res.body.data).toHaveProperty("progress");
  });
});
