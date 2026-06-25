const express = require("express");
const {
  registerUser,
  loginUser,
  googleLogin,
  getCurrentUser,
  logoutUser,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", logoutUser);

module.exports = router;