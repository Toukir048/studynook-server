const { ObjectId } = require("mongodb");
const { getCollections } = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");
const cookieOptions = require("../utils/cookieOptions");

const sanitizeUser = (user) => {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    provider: user.provider,
    bookings: user.bookings || [],
    createdAt: user.createdAt,
  };
};

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

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { usersCollection } = getCollections();

    const user = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (!user || !user.password) {
      return res.status(401).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
    });

    res.cookie("token", token, cookieOptions);

    res.send({
      success: true,
      message: "Login successful",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { name, email, photoURL } = req.body;

    if (!name || !email || !photoURL) {
      return res.status(400).send({
        success: false,
        message: "Name, email, and photo URL are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { usersCollection } = getCollections();

    let user = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      const newUser = {
        name: name.trim(),
        email: normalizedEmail,
        photoURL,
        password: null,
        provider: "google",
        bookings: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);

      user = {
        _id: result.insertedId,
        ...newUser,
      };
    }

    const token = generateToken({
      userId: user._id.toString(),
    });

    res.cookie("token", token, cookieOptions);

    res.send({
      success: true,
      message: "Google login successful",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const { usersCollection } = getCollections();

    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );

    res.send({
      success: true,
      message: "Current user retrieved successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.send({
    success: true,
    message: "Logout successful",
  });
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getCurrentUser,
  logoutUser,
};