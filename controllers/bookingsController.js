const { ObjectId } = require("mongodb");
const { getCollections } = require("../config/db");

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

const isValidObjectId = (id) => ObjectId.isValid(id);

const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

const getHour = (time) => {
  return Number(time.split(":")[0]);
};

const validateBookingTime = (startTime, endTime) => {
  if (!timeSlots.includes(startTime) || !timeSlots.includes(endTime)) {
    return "Invalid time slot";
  }

  if (getHour(endTime) <= getHour(startTime)) {
    return "End time must be after start time";
  }

  if (startTime === "20:00") {
    return "Start time cannot be 20:00";
  }

  return null;
};

const createBooking = async (req, res, next) => {
  try {
    const { roomId, date, startTime, endTime, specialNote = "" } = req.body;

    if (!roomId || !date || !startTime || !endTime) {
      return res.status(400).send({
        success: false,
        message: "Room ID, date, start time, and end time are required",
      });
    }

    if (!isValidObjectId(roomId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid room ID",
      });
    }

    if (date < getTodayDate()) {
      return res.status(400).send({
        success: false,
        message: "Booking date must be today or a future date",
      });
    }

    const timeError = validateBookingTime(startTime, endTime);

    if (timeError) {
      return res.status(400).send({
        success: false,
        message: timeError,
      });
    }

    const { roomsCollection, bookingsCollection, usersCollection } =
      getCollections();

    const room = await roomsCollection.findOne({
      _id: new ObjectId(roomId),
    });

    if (!room) {
      return res.status(404).send({
        success: false,
        message: "Room not found",
      });
    }

    const existingConflict = await bookingsCollection.findOne({
      roomId,
      date,
      status: "confirmed",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (existingConflict) {
      return res.status(409).send({
        success: false,
        message: "This room is already booked for the selected time slot",
      });
    }

    const duration = getHour(endTime) - getHour(startTime);
    const totalCost = duration * Number(room.hourlyRate);

    const newBooking = {
      roomId,
      roomName: room.roomName,
      roomImage: room.image,
      floor: room.floor,
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      date,
      startTime,
      endTime,
      totalCost,
      specialNote,
      status: "confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await bookingsCollection.insertOne(newBooking);

    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.id) },
      {
        $push: {
          bookings: result.insertedId.toString(),
        },
      }
    );

    await roomsCollection.updateOne(
      { _id: new ObjectId(roomId) },
      {
        $inc: {
          bookingCount: 1,
        },
      }
    );

    res.status(201).send({
      success: true,
      message: "Room booked successfully",
      booking: {
        _id: result.insertedId,
        ...newBooking,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const { bookingsCollection, roomsCollection } = getCollections();

    const bookings = await bookingsCollection
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    const roomObjectIds = bookings
      .map((booking) => booking.roomId)
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const rooms = await roomsCollection
      .find({ _id: { $in: roomObjectIds } })
      .toArray();

    const roomMap = {};

    rooms.forEach((room) => {
      roomMap[room._id.toString()] = room;
    });

    const populatedBookings = bookings.map((booking) => ({
      ...booking,
      room: roomMap[booking.roomId] || null,
    }));

    res.send({
      success: true,
      message: "My bookings retrieved successfully",
      bookings: populatedBookings,
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const { bookingsCollection, usersCollection, roomsCollection } =
      getCollections();

    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!booking) {
      return res.status(404).send({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).send({
        success: false,
        message: "Forbidden. You can cancel only your own booking",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).send({
        success: false,
        message: "Only confirmed bookings can be cancelled",
      });
    }

    if (booking.date < getTodayDate()) {
      return res.status(400).send({
        success: false,
        message: "Past bookings cannot be cancelled",
      });
    }

    await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.id) },
      {
        $pull: {
          bookings: id,
        },
      }
    );

    if (ObjectId.isValid(booking.roomId)) {
      await roomsCollection.updateOne(
        { _id: new ObjectId(booking.roomId) },
        {
          $inc: {
            bookingCount: -1,
          },
        }
      );
    }

    const updatedBooking = await bookingsCollection.findOne({
      _id: new ObjectId(id),
    });

    res.send({
      success: true,
      message: "Booking cancelled",
      booking: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
};