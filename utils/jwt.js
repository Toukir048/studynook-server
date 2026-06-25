const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing in .env file");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "7d",
  });
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing in .env file");
  }

  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};