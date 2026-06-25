const express = require("express");
const {
  createRoom,
  getAllRooms,
  getLatestRooms,
  getMyListings,
  getRoomById,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomsController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllRooms);
router.get("/latest", getLatestRooms);
router.get("/my-listings", authMiddleware, getMyListings);
router.get("/:id", getRoomById);

router.post("/", authMiddleware, createRoom);
router.patch("/:id", authMiddleware, updateRoom);
router.delete("/:id", authMiddleware, deleteRoom);

module.exports = router;