const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const multer = require("multer");


const activityRoutes = require("./routes/activityRoutes");
const userRoutes = require("./routes/userRoutes");
const app = express();
const json = express.json();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "media");
  },
  filename:(req,file,cb)=>{
    cb(null,new Date().toISOString()+'-'+file.originalname);
  }
});

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this ip in 1 hour",
});

app.use("/api", limiter);
app.use(helmet());
app.use(json);
app.use(cors());

app.use(multer({ storage: fileStorage }).single('image'));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(morgan("dev"));

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});



app.use("/connectc/v1/users", userRoutes);
app.use("/connectc/v1/activity", activityRoutes);

app.use((error, req, res, next) => {
  const stack = error.stack.split("\n")[0] + error.stack.split("\n")[1];
  console.log(stack);
  res.status(error.status).json({
    status: "fail",
    message: error.message,
    stack,
  });
});

module.exports = app;
