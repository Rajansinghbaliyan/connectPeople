module.exports = (res, status, statusMessage, data) => {
  res.status(status).json({
    statusCode : 0,
    message: statusMessage,
    data,
  });
};
