"use strict";

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Netprime API",
      version: "1.0.0",
      description: `
## Netprime Movie Streaming Platform API

Production-grade microservices backend for a movie streaming platform.

### Authentication
Most endpoints require a Bearer token in the Authorization header.
1. Register or login to get an \`accessToken\`
2. Click **Authorize** and enter: \`Bearer YOUR_TOKEN\`
3. The token expires in 15 minutes — use the refresh endpoint to get a new one

### Services & Ports
| Service | Port | Description |
|---------|------|-------------|
| Gateway | 3000 | Single entry point, JWT verification, routing |
| Auth | 3001 | Registration, login, token management |
| User | 3002 | Profiles, watchlist, subscriptions |
| Movie | 3003 | Movie catalogue, reviews |
| Stream | 3004 | HLS stream URLs, watch progress |
| Upload | 3005 | Presigned S3 upload URLs, transcoding |
| Notification | 3006 | Internal email service (not via gateway) |
      `,
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development (via Gateway)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            code: { type: "string", example: "VALIDATION_ERROR" },
            message: { type: "string" },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            role: { type: "string", enum: ["user", "admin", "moderator"] },
            avatar: { type: "string", nullable: true },
            isEmailVerified: { type: "boolean" },
            subscription: {
              type: "object",
              properties: {
                plan: { type: "string", enum: ["free", "basic", "premium"] },
                expiresAt: { type: "string", nullable: true },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Movie: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string", example: "Inception" },
            description: { type: "string" },
            genres: { type: "array", items: { type: "string" } },
            releaseYear: { type: "integer", example: 2010 },
            duration: { type: "integer", example: 148 },
            ageRating: { type: "string", example: "PG-13" },
            director: { type: "string" },
            status: {
              type: "string",
              enum: ["draft", "processing", "published", "archived"],
            },
            isFeatured: { type: "boolean" },
            isFree: { type: "boolean" },
            requiredPlan: {
              type: "string",
              enum: ["free", "basic", "premium"],
            },
            slug: { type: "string", example: "inception-2010" },
            durationFormatted: { type: "string", example: "2h 28m" },
            rating: {
              type: "object",
              properties: {
                average: { type: "number" },
                count: { type: "integer" },
              },
            },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            bio: { type: "string", nullable: true },
            country: { type: "string", nullable: true },
            language: { type: "string" },
            subscription: {
              type: "object",
              properties: {
                plan: { type: "string", enum: ["free", "basic", "premium"] },
                startedAt: { type: "string", nullable: true },
                expiresAt: { type: "string", nullable: true },
                autoRenew: { type: "boolean" },
              },
            },
            preferences: {
              type: "object",
              properties: {
                preferredGenres: { type: "array", items: { type: "string" } },
                preferredQuality: { type: "string" },
                autoplay: { type: "boolean" },
                notifications: {
                  type: "object",
                  properties: {
                    email: { type: "boolean" },
                    push: { type: "boolean" },
                  },
                },
              },
            },
            watchlist: { type: "array", items: { type: "object" } },
            isActive: { type: "boolean" },
            role: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      // ── HEALTH ─────────────────────────────────────────────────────
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Gateway health + all service URLs",
          security: [],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/auth/health": {
        get: {
          tags: ["Health"],
          summary: "Auth service health",
          security: [],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/movies/health": {
        get: {
          tags: ["Health"],
          summary: "Movie service health",
          security: [],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/users/health": {
        get: {
          tags: ["Health"],
          summary: "User service health",
          security: [],
          responses: { 200: { description: "OK" } },
        },
      },

      // ── AUTH ───────────────────────────────────────────────────────
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password", "confirmPassword"],
                  properties: {
                    name: { type: "string", example: "John Doe" },
                    email: { type: "string", example: "john@example.com" },
                    password: { type: "string", example: "Password123!" },
                    confirmPassword: {
                      type: "string",
                      example: "Password123!",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Registered successfully" },
            400: { description: "Validation error" },
            409: { description: "Email already exists" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login — returns access token + sets refresh token cookie",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "john@example.com" },
                    password: { type: "string", example: "Password123!" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token using httpOnly refresh token cookie",
          security: [],
          responses: {
            200: { description: "New access token" },
            401: { description: "Invalid refresh token" },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current authenticated user",
          responses: { 200: { description: "Current user" } },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout — blacklists current access token",
          responses: { 200: { description: "Logged out" } },
        },
      },
      "/api/auth/logout-all": {
        post: {
          tags: ["Auth"],
          summary: "Logout from all devices — invalidates all refresh tokens",
          responses: { 200: { description: "Logged out everywhere" } },
        },
      },
      "/api/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request password reset email",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", example: "john@example.com" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description:
                "Email sent (same response whether email exists or not)",
            },
          },
        },
      },
      "/api/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password using token from email link",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token", "password", "confirmPassword"],
                  properties: {
                    token: { type: "string" },
                    password: { type: "string", example: "NewPassword123!" },
                    confirmPassword: {
                      type: "string",
                      example: "NewPassword123!",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Password reset successfully" },
            400: { description: "Invalid or expired token" },
          },
        },
      },
      "/api/auth/verify-email/{token}": {
        get: {
          tags: ["Auth"],
          summary: "Verify email address from link",
          security: [],
          parameters: [
            {
              name: "token",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Email verified" },
            400: { description: "Invalid or expired token" },
          },
        },
      },

      // ── MOVIES ─────────────────────────────────────────────────────
      "/api/movies": {
        get: {
          tags: ["Movies"],
          summary: "List movies with filtering and pagination",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
            {
              name: "genre",
              in: "query",
              schema: { type: "string", example: "Action" },
            },
            {
              name: "year",
              in: "query",
              schema: { type: "integer", example: 2010 },
            },
            {
              name: "sort",
              in: "query",
              schema: {
                type: "string",
                enum: ["newest", "oldest", "rating", "popular", "title"],
              },
            },
            { name: "isFree", in: "query", schema: { type: "boolean" } },
            {
              name: "status",
              in: "query",
              description: "Admin only",
              schema: {
                type: "string",
                enum: ["draft", "processing", "published", "archived"],
              },
            },
          ],
          responses: { 200: { description: "Paginated list of movies" } },
        },
        post: {
          tags: ["Movies"],
          summary: "Create a movie — Admin only",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "title",
                    "description",
                    "genres",
                    "releaseYear",
                    "duration",
                  ],
                  properties: {
                    title: { type: "string", example: "Inception" },
                    description: {
                      type: "string",
                      example: "A mind-bending thriller",
                    },
                    genres: {
                      type: "array",
                      items: { type: "string" },
                      example: ["Action", "Sci-Fi"],
                    },
                    releaseYear: { type: "integer", example: 2010 },
                    duration: {
                      type: "integer",
                      example: 148,
                      description: "Duration in minutes",
                    },
                    director: { type: "string", example: "Christopher Nolan" },
                    cast: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          character: { type: "string" },
                        },
                      },
                    },
                    ageRating: {
                      type: "string",
                      enum: ["G", "PG", "PG-13", "R", "NC-17", "NR"],
                    },
                    language: { type: "string", example: "English" },
                    country: { type: "string", example: "USA" },
                    isFree: { type: "boolean", default: false },
                    requiredPlan: {
                      type: "string",
                      enum: ["free", "basic", "premium"],
                      default: "basic",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Movie created" },
            403: { description: "Admin required" },
          },
        },
      },
      "/api/movies/search": {
        get: {
          tags: ["Movies"],
          summary: "Search movies by title, description, director, or cast",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", example: "inception" },
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: { 200: { description: "Search results" } },
        },
      },
      "/api/movies/featured": {
        get: {
          tags: ["Movies"],
          summary: "Get featured published movies",
          responses: { 200: { description: "Featured movies" } },
        },
      },
      "/api/movies/trending": {
        get: {
          tags: ["Movies"],
          summary: "Get trending movies by view count",
          responses: { 200: { description: "Trending movies" } },
        },
      },
      "/api/movies/genres": {
        get: {
          tags: ["Movies"],
          summary: "Get all genres that have published movies",
          responses: { 200: { description: "List of genres" } },
        },
      },
      "/api/movies/{idOrSlug}": {
        get: {
          tags: ["Movies"],
          summary: "Get movie by MongoDB ID or slug",
          parameters: [
            {
              name: "idOrSlug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "e.g. 64a1b2... or inception-2010",
            },
          ],
          responses: {
            200: { description: "Movie details" },
            404: { description: "Not found" },
          },
        },
        patch: {
          tags: ["Movies"],
          summary: "Update movie metadata — Admin only",
          parameters: [
            {
              name: "idOrSlug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    genres: { type: "array", items: { type: "string" } },
                    isFeatured: { type: "boolean" },
                    status: {
                      type: "string",
                      enum: ["draft", "processing", "published", "archived"],
                    },
                    requiredPlan: {
                      type: "string",
                      enum: ["free", "basic", "premium"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated" },
            403: { description: "Admin required" },
          },
        },
        delete: {
          tags: ["Movies"],
          summary: "Soft delete — sets status to archived — Admin only",
          parameters: [
            {
              name: "idOrSlug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Movie archived" },
            403: { description: "Admin required" },
          },
        },
      },
      "/api/movies/{id}/status": {
        patch: {
          tags: ["Movies"],
          summary: "Update movie status — Admin only",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: {
                      type: "string",
                      enum: ["draft", "processing", "published", "archived"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Status updated" },
            403: { description: "Admin required" },
          },
        },
      },

      // ── REVIEWS ────────────────────────────────────────────────────
      "/api/movies/{id}/reviews": {
        get: {
          tags: ["Reviews"],
          summary: "Get reviews for a movie",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: { 200: { description: "Paginated reviews" } },
        },
        post: {
          tags: ["Reviews"],
          summary: "Add a review — one per user per movie",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["rating"],
                  properties: {
                    rating: {
                      type: "integer",
                      minimum: 1,
                      maximum: 10,
                      example: 9,
                    },
                    title: {
                      type: "string",
                      example: "Mind-bending masterpiece",
                    },
                    body: {
                      type: "string",
                      example: "Christopher Nolan at his best.",
                    },
                    spoiler: { type: "boolean", default: false },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Review added" },
            409: { description: "Already reviewed" },
          },
        },
      },
      "/api/movies/{id}/reviews/{reviewId}": {
        patch: {
          tags: ["Reviews"],
          summary: "Update your review",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "reviewId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    rating: { type: "integer", minimum: 1, maximum: 10 },
                    title: { type: "string" },
                    body: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Updated" } },
        },
        delete: {
          tags: ["Reviews"],
          summary: "Delete your review",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "reviewId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Deleted" } },
        },
      },

      // ── USERS ──────────────────────────────────────────────────────
      "/api/users/me": {
        get: {
          tags: ["Users"],
          summary: "Get my profile",
          responses: { 200: { description: "My profile" } },
        },
        patch: {
          tags: ["Users"],
          summary: "Update my profile",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    bio: { type: "string" },
                    country: { type: "string", example: "Nigeria" },
                    language: { type: "string", example: "en" },
                    avatar: { type: "string" },
                    dateOfBirth: { type: "string", format: "date" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Updated" } },
        },
      },
      "/api/users/me/preferences": {
        patch: {
          tags: ["Users"],
          summary: "Update my preferences",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    preferredGenres: {
                      type: "array",
                      items: { type: "string" },
                    },
                    preferredQuality: {
                      type: "string",
                      enum: ["360p", "480p", "720p", "1080p", "4K", "auto"],
                    },
                    autoplay: { type: "boolean" },
                    notifications: {
                      type: "object",
                      properties: {
                        email: { type: "boolean" },
                        push: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Preferences updated" } },
        },
      },
      "/api/users/me/watchlist": {
        get: {
          tags: ["Users"],
          summary: "Get my watchlist",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: { 200: { description: "Watchlist" } },
        },
      },
      "/api/users/me/watchlist/{movieId}": {
        post: {
          tags: ["Users"],
          summary: "Add movie to watchlist",
          parameters: [
            {
              name: "movieId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Added" },
            409: { description: "Already in watchlist" },
          },
        },
        delete: {
          tags: ["Users"],
          summary: "Remove movie from watchlist",
          parameters: [
            {
              name: "movieId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Removed" } },
        },
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "List all users — Admin only",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: {
            200: { description: "All users" },
            403: { description: "Admin required" },
          },
        },
      },
      "/api/users/{userId}": {
        get: {
          tags: ["Users"],
          summary: "Get public profile of any user",
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Public profile" },
            404: { description: "Not found" },
          },
        },
      },
      "/api/users/{userId}/subscription": {
        patch: {
          tags: ["Users"],
          summary: "Update user subscription — Admin only",
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["plan"],
                  properties: {
                    plan: {
                      type: "string",
                      enum: ["free", "basic", "premium"],
                    },
                    expiresAt: { type: "string", format: "date-time" },
                    autoRenew: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Subscription updated" },
            403: { description: "Admin required" },
          },
        },
      },
      "/api/users/{userId}/status": {
        patch: {
          tags: ["Users"],
          summary: "Activate or deactivate a user account — Admin only",
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["isActive"],
                  properties: {
                    isActive: {
                      type: "boolean",
                      example: false,
                      description: "false to deactivate, true to reactivate",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Status updated" },
            403: { description: "Admin required" },
          },
        },
      },

      // ── UPLOADS ────────────────────────────────────────────────────
      "/api/uploads/presigned-url": {
        post: {
          tags: ["Uploads"],
          summary:
            "Step 1 — Get presigned S3 URL to upload video directly to R2",
          description:
            "Returns a signed URL valid for 15 minutes. PUT the raw video file to this URL directly from the browser. The file never touches the Node.js server.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fileName", "mimeType", "sizeBytes", "movieId"],
                  properties: {
                    fileName: { type: "string", example: "inception.mp4" },
                    mimeType: {
                      type: "string",
                      enum: [
                        "video/mp4",
                        "video/quicktime",
                        "video/x-msvideo",
                        "video/x-matroska",
                        "video/webm",
                        "video/mpeg",
                      ],
                      example: "video/mp4",
                    },
                    sizeBytes: {
                      type: "integer",
                      example: 4805379,
                      description: "File size in bytes. Maximum 4 GB.",
                    },
                    movieId: {
                      type: "string",
                      example: "64a1b2c3d4e5f6a7b8c9d0e1",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Presigned URL ready",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "object",
                        properties: {
                          uploadId: {
                            type: "string",
                            format: "uuid",
                            description: "Save this — needed for confirm step",
                          },
                          presignedUrl: {
                            type: "string",
                            description: "PUT your video file to this URL",
                          },
                          s3Key: { type: "string" },
                          expiresIn: {
                            type: "integer",
                            example: 900,
                            description: "Seconds until URL expires",
                          },
                          maxSizeBytes: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/uploads/confirm": {
        post: {
          tags: ["Uploads"],
          summary: "Step 2 — Confirm upload complete and trigger transcoding",
          description:
            "Call after successfully uploading to S3. Verifies file exists in R2 and dispatches FFmpeg transcoding job via BullMQ.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["uploadId"],
                  properties: {
                    uploadId: {
                      type: "string",
                      format: "uuid",
                      example: "0f5f8c83-aa07-4ad0-b536-1eed880ef50d",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Transcoding queued" },
            404: {
              description:
                "File not found in R2 — upload may have failed or URL expired",
            },
          },
        },
      },
      "/api/uploads/{uploadId}/status": {
        get: {
          tags: ["Uploads"],
          summary: "Step 3 — Poll transcoding status",
          description:
            "Poll this to track progress. Status progression: pending → queued → processing → completed (or failed)",
          parameters: [
            {
              name: "uploadId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: {
              description: "Current upload/transcode status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "object",
                        properties: {
                          uploadId: { type: "string" },
                          status: {
                            type: "string",
                            enum: [
                              "pending",
                              "queued",
                              "processing",
                              "completed",
                              "failed",
                            ],
                          },
                          progress: {
                            type: "integer",
                            minimum: 0,
                            maximum: 100,
                          },
                          outputs: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                quality: { type: "string" },
                                s3KeyHls: { type: "string" },
                                durationSec: { type: "number" },
                              },
                            },
                          },
                          errorMessage: { type: "string", nullable: true },
                          queuedAt: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                          },
                          startedAt: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                          },
                          completedAt: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/uploads": {
        get: {
          tags: ["Uploads"],
          summary: "List my uploads",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
            },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: [
                  "pending",
                  "queued",
                  "processing",
                  "completed",
                  "failed",
                ],
              },
            },
          ],
          responses: { 200: { description: "Paginated uploads" } },
        },
      },
      "/api/uploads/{uploadId}": {
        delete: {
          tags: ["Uploads"],
          summary: "Delete an upload and its S3 files — Admin only",
          parameters: [
            {
              name: "uploadId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Deleted" },
            403: { description: "Admin required" },
          },
        },
      },

      // ── STREAM ─────────────────────────────────────────────────────
      "/api/stream/{movieId}": {
        get: {
          tags: ["Stream"],
          summary: "Get HLS stream URLs — requires valid subscription",
          description:
            "Returns signed CDN URLs for HLS manifests. Creates or resumes a watch session. Requires the user's subscription plan to meet the movie's requiredPlan.",
          parameters: [
            {
              name: "movieId",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Movie ObjectId",
            },
            {
              name: "quality",
              in: "query",
              schema: {
                type: "string",
                enum: ["240p", "360p", "480p", "720p", "1080p", "4K", "auto"],
                default: "auto",
              },
              description: "auto returns all available qualities",
            },
          ],
          responses: {
            200: {
              description: "Stream URLs + session info",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "object",
                        properties: {
                          movieId: { type: "string" },
                          title: { type: "string" },
                          streams: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                quality: { type: "string", example: "720p" },
                                url: {
                                  type: "string",
                                  description: "Signed HLS manifest URL",
                                },
                                duration: { type: "integer" },
                                expiresAt: {
                                  type: "string",
                                  format: "date-time",
                                },
                              },
                            },
                          },
                          session: {
                            type: "object",
                            properties: {
                              sessionToken: { type: "string" },
                              progressSeconds: { type: "integer" },
                              percentWatched: { type: "number" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            402: { description: "Subscription upgrade required" },
            503: { description: "Movie not yet transcoded" },
          },
        },
      },
      "/api/stream/{movieId}/progress": {
        get: {
          tags: ["Stream"],
          summary: "Get watch progress for a movie",
          parameters: [
            {
              name: "movieId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Progress data" } },
        },
        post: {
          tags: ["Stream"],
          summary:
            "Save watch progress — call every ~30 seconds while watching",
          parameters: [
            {
              name: "movieId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["progressSeconds"],
                  properties: {
                    progressSeconds: { type: "integer", example: 600 },
                    durationSeconds: { type: "integer", example: 8880 },
                    quality: {
                      type: "string",
                      enum: [
                        "240p",
                        "360p",
                        "480p",
                        "720p",
                        "1080p",
                        "4K",
                        "auto",
                      ],
                      example: "720p",
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Progress saved" } },
        },
      },
      "/api/stream/history": {
        get: {
          tags: ["Stream"],
          summary: "Get my watch history",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
          ],
          responses: { 200: { description: "Watch history with pagination" } },
        },
      },
      "/api/stream/history/{movieId}": {
        delete: {
          tags: ["Stream"],
          summary: "Remove a movie from watch history",
          parameters: [
            {
              name: "movieId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "Removed from history" } },
        },
      },
      "/api/stream/admin/analytics": {
        get: {
          tags: ["Stream"],
          summary: "Streaming analytics — Admin only",
          description:
            "Returns top movies by view count and other streaming metrics.",
          responses: {
            200: { description: "Analytics data" },
            403: { description: "Admin required" },
          },
        },
      },

      // ── NOTIFICATION (internal — accessed directly on port 3006) ──
      "/email/welcome": {
        post: {
          tags: ["Notification (internal — port 3006)"],
          summary: "Send welcome email",
          description:
            "Internal endpoint. Call directly on http://localhost:3006. Requires x-internal-secret header.",
          servers: [
            {
              url: "http://localhost:3006",
              description: "Notification service (direct)",
            },
          ],
          security: [],
          parameters: [
            {
              name: "x-internal-secret",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email"],
                  properties: {
                    name: { type: "string", example: "John Doe" },
                    email: { type: "string", example: "john@example.com" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Email sent" },
            403: { description: "Invalid internal secret" },
          },
        },
      },
      "/email/verify": {
        post: {
          tags: ["Notification (internal — port 3006)"],
          summary: "Send email verification link",
          servers: [{ url: "http://localhost:3006" }],
          security: [],
          parameters: [
            {
              name: "x-internal-secret",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    verifyUrl: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Email sent" } },
        },
      },
      "/email/password-reset": {
        post: {
          tags: ["Notification (internal — port 3006)"],
          summary: "Send password reset email",
          servers: [{ url: "http://localhost:3006" }],
          security: [],
          parameters: [
            {
              name: "x-internal-secret",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    resetUrl: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Email sent" } },
        },
      },
      "/email/transcode-complete": {
        post: {
          tags: ["Notification (internal — port 3006)"],
          summary: "Send transcode complete notification",
          servers: [{ url: "http://localhost:3006" }],
          security: [],
          parameters: [
            {
              name: "x-internal-secret",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    movieTitle: { type: "string" },
                    movieId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Email sent" } },
        },
      },
      "/email/transcode-failed": {
        post: {
          tags: ["Notification (internal — port 3006)"],
          summary: "Send transcode failed notification",
          servers: [{ url: "http://localhost:3006" }],
          security: [],
          parameters: [
            {
              name: "x-internal-secret",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    movieTitle: { type: "string" },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Email sent" } },
        },
      },
      "/email/subscription-upgrade": {
        post: {
          tags: ["Notification (internal — port 3006)"],
          summary: "Send subscription upgrade confirmation",
          servers: [{ url: "http://localhost:3006" }],
          security: [],
          parameters: [
            {
              name: "x-internal-secret",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    plan: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Email sent" } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
