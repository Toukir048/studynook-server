const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { connectDB, getDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const roomsRoutes = require("./routes/roomsRoutes");
const bookingsRoutes = require("./routes/bookingsRoutes");

const app = express();

const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const allowedOrigins = clientUrl.split(",").map((url) => url.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({
    success: true,
    message: "StudyNook server is running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const db = getDB();
    await db.command({ ping: 1 });

    res.send({
      success: true,
      message: "StudyNook API is healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Database is not connected",
      error: error.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/bookings", bookingsRoutes);

app.use((req, res) => {
  res.status(404).send({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Server Error:", error.message);

  res.status(error.status || 500).send({
    success: false,
    message: error.message || "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`StudyNook server is running on port ${port}`);

  connectDB()
    .then(() => {
      console.log("Database connection ready");
    })
    .catch((error) => {
      console.error("Database connection failed:", error.message);
    });
});