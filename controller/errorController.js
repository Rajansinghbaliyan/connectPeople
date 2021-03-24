const AppError = require("../services/AppError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  let value = err.errmsg.match(/"([^"]*)"/)[0];
  value = value
    .match(/"([^"]*)"/)
    .toString()
    .split(",")[1];

  const message = `Duplicate field value: ${value}. Please enter the different value`;
  return new AppError(message, 400);
};

const handleValidationFieldDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  // let message = "Please enter " ;

  // for(let e in err.errors){
  //   if(err.errors[e].properties)
  //   message += e +", ";
  // }

  const message = `Invalid input : ${errors.join(". ")}`;
  return new AppError(JSON.stringify(message), 400);
};

const handleWrongRequestJson = (err) => {
  return new AppError(err.message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    err,
    statusCode: 1,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      statusCode: 1,
      message: err.message,
    });
  } else {
    console.error("ERROR 💣", err);

    res.status(500).json({
      status: "err",
      message: "Something went very wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "err";
  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (err.kind === "ObjectId") error = handleCastErrorDB(err);

    if (err.name === "CastName") error = handleCastErrorDB(err);

    if (err.code === 11000) error = handleDuplicateFieldDB(err);

    if (err.name === "ValidationError") error = handleValidationFieldDB(err);

    if (err.type === "entity.parse.failed") error = handleWrongRequestJson(err);

    sendErrorProd(error, res);
  }
};
