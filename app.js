const app = require("./middleware/middleware");

const activityRoutes = require("./routes/activityRoutes");
const userRoutes = require("./routes/userRoutes");
const AppError = require("./services/AppError");
const globalErrorHandler = require('./controller/errorController');

app.use("/connectc/v1/users", userRoutes);
app.use("/connectc/v1/activity", activityRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't access ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
