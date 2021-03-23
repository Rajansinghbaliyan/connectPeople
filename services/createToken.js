const jwt = require("jsonwebtoken");
const respond = require("./respond");

const createSendToken = (user, res, status, message) => {
  const token = signToken(user.id);
  res.status(status).json({
    statusCode: 0,
    token
  })
};

const signToken = (id) => {
  return jwt.sign({ _id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

module.exports = createSendToken;