const { getCollections } = require("../config/db");
const { hashPassword } = require("../utils/password");

const registerUser = async (req, res, next) => {
  try {
    const { name, email, photoURL, password } = req.body;

    if (!name || !email || !photoURL || !password) {
      return res.status(400).send({
        success: false,
        message: "Name, email, photo URL, and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { usersCollection } = getCollections();

    const existingUser = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
      name: name.trim(),
      email: normalizedEmail,
      photoURL,
      password: hashedPassword,
      provider: "email-password",
      bookings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).send({
      success: true,
      message: "Registration successful",
      user: {
        _id: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL,
        provider: newUser.provider,
        bookings: newUser.bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
};