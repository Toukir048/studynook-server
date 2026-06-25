const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check route
app.get("/", (req, res) => {
  res.send({
    success: true,
    message: "StudyNook server is running",
  });
});

app.get("/api/health", (req, res) => {
  res.send({
    success: true,
    message: "Server health check successful",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Not found route
app.use((req, res) => {
  res.status(404).send({
    success: false,
    message: "API route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).send({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`StudyNook server is running on port ${port}`);
});