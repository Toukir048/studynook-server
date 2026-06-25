const { ObjectId } = require("mongodb");
const { getCollections } = require("../config/db");

const isValidObjectId = (id) => ObjectId.isValid(id);

const createRoom = async (req, res, next) => {
  try {
    const { roomName, description, image, floor, capacity, hourlyRate, amenities } =
      req.body;

    if (
      !roomName ||
      !description ||
      !image ||
      !floor ||
      !capacity ||
      !hourlyRate ||
      !Array.isArray(amenities) ||
      amenities.length === 0
    ) {
      return res.status(400).send({
        success: false,
        message:
          "Room name, description, image, floor, capacity, hourly rate, and amenities are required",
      });
    }

    const { roomsCollection } = getCollections();

    const newRoom = {
      roomName: roomName.trim(),
      description: description.trim(),
      image,
      floor,
      capacity: Number(capacity),
      hourlyRate: Number(hourlyRate),
      amenities,
      ownerId: req.user.id,
      ownerEmail: req.user.email,
      ownerName: req.user.name,
      ownerPhotoURL: req.user.photoURL,
      bookingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await roomsCollection.insertOne(newRoom);

    res.status(201).send({
      success: true,
      message: "Room added successfully",
      room: {
        _id: result.insertedId,
        ...newRoom,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllRooms = async (req, res, next) => {
  try {
    const { search, amenities, minRate, maxRate } = req.query;

    const query = {};

    if (search) {
      query.roomName = {
        $regex: search,
        $options: "i",
      };
    }

    if (amenities) {
      const amenityArray = amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (amenityArray.length > 0) {
        query.amenities = {
          $in: amenityArray,
        };
      }
    }

    if (minRate || maxRate) {
      query.hourlyRate = {};

      if (minRate) {
        query.hourlyRate.$gte = Number(minRate);
      }

      if (maxRate) {
        query.hourlyRate.$lte = Number(maxRate);
      }
    }

    const { roomsCollection } = getCollections();

    const rooms = await roomsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.send({
      success: true,
      message: "Rooms retrieved successfully",
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

const getLatestRooms = async (req, res, next) => {
  try {
    const { roomsCollection } = getCollections();

    const rooms = await roomsCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.send({
      success: true,
      message: "Latest rooms retrieved successfully",
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

const getMyListings = async (req, res, next) => {
  try {
    const { roomsCollection } = getCollections();

    const rooms = await roomsCollection
      .find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    res.send({
      success: true,
      message: "My listings retrieved successfully",
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid room ID",
      });
    }

    const { roomsCollection } = getCollections();

    const room = await roomsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!room) {
      return res.status(404).send({
        success: false,
        message: "Room not found",
      });
    }

    res.send({
      success: true,
      message: "Room retrieved successfully",
      room,
    });
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid room ID",
      });
    }

    const { roomsCollection } = getCollections();

    const room = await roomsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!room) {
      return res.status(404).send({
        success: false,
        message: "Room not found",
      });
    }

    if (room.ownerId !== req.user.id) {
      return res.status(403).send({
        success: false,
        message: "Forbidden. You can update only your own room",
      });
    }

    const allowedFields = [
      "roomName",
      "description",
      "image",
      "floor",
      "capacity",
      "hourlyRate",
      "amenities",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.capacity !== undefined) {
      updateData.capacity = Number(updateData.capacity);
    }

    if (updateData.hourlyRate !== undefined) {
      updateData.hourlyRate = Number(updateData.hourlyRate);
    }

    if (
      updateData.amenities !== undefined &&
      (!Array.isArray(updateData.amenities) || updateData.amenities.length === 0)
    ) {
      return res.status(400).send({
        success: false,
        message: "Amenities must be a non-empty array",
      });
    }

    updateData.updatedAt = new Date();

    await roomsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateData,
      }
    );

    const updatedRoom = await roomsCollection.findOne({
      _id: new ObjectId(id),
    });

    res.send({
      success: true,
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid room ID",
      });
    }

    const { roomsCollection } = getCollections();

    const room = await roomsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!room) {
      return res.status(404).send({
        success: false,
        message: "Room not found",
      });
    }

    if (room.ownerId !== req.user.id) {
      return res.status(403).send({
        success: false,
        message: "Forbidden. You can delete only your own room",
      });
    }

    await roomsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.send({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  getLatestRooms,
  getMyListings,
  getRoomById,
  updateRoom,
  deleteRoom,
};