require("dotenv").config();
require("express-async-errors");

// express
const express = require("express");
const app = express();

// other packages
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger.js");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const rateLimiter = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");

// Connect to Database
const connectDB = require("./config/database.js");

// Routers
const authRoutes = require("./routes/authRoutes.js");
const movieRoutes = require("./routes/movieRoutes.js");
const genreRoutes = require("./routes/genreRoutes.js");
const userRoutes = require("./routes/userRoutes.js");

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
const errorHandler = require("./middleware/errorHandler.js");

// security
app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  }),
);

app.use(helmet());
app.use(cors());
app.use(xss());
app.use(mongoSanitize());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.static("./public"));
app.use(fileUpload());

// Routes
app.get("/", (req, res) => {
  res.send("netprime api");
});
app.get("/api/v1", (req, res) => {
  res.send("netprime api");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/movies", movieRoutes);
app.use("/api/v1/genres", genreRoutes);
app.use("/api/v1/users", userRoutes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

// Error Handler
app.use(errorHandler);

const port = process.env.PORT || 5000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(
      port,
      console.log(`🎬 NetPrime Backend Server running on port ${port}`),
    );
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};
start();
