const { ObjectId } = require("mongodb");
const { getCollections } = require("../config/db");
const { verifyToken } = require("../utils/jwt");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access. Token not found",
      });
    }

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access. Invalid token",
      });
    }

    const { usersCollection } = getCollections();

    const user = await usersCollection.findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access. User not found",
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
    };

    next();
  } catch (error) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized access. Token invalid or expired",
    });
  }
};

module.exports = authMiddleware;