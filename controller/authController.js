const User = require("../model/user");
const respond = require("../services/respond");
const sendMail = require("../util/email");
const crypto = require("crypto");
const passport = require("passport");
const createSendToken = require("../services/createToken");
const jwt = require("jsonwebtoken");
const catchAsync = require("../services/catchAsync");
const AppError = require("../services/AppError");
require("../services/passport");

exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

exports.googleCallback = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    createSendToken(user, res, 201, "User logged using google oauth");
  })(req, res, next);
};

exports.facebookAuth = passport.authenticate("facebook", {
  scope: "read_stream",
});

exports.facebookCallback = (req, res, next) => {
  passport.authenticate("facebook", (err, user, info) => {
    createSendToken(user, res, 201, "User logged using facebook");
  })(req, res, next);
};

exports.signup = catchAsync(async (req, res, next) => {
  console.log("In the signup");
  const data = req.body;
  // const images = [];
  // if (!req.files || req.files.length === 0)
  //   return next(new AppError("Please provide the images", 404));

  // req.files.forEach((el) => {
  //   images.push(el.path);
  // });
  const user = await User.create({
    name: data.name,
    email: data.email,
    //photoUrl: images,
    password: data.password,
    age: data.age,
    phone: data.phone,
    deviceType: data.deviceType,
    passwordUpdatedAt: Date.now(),
  });

  createSendToken(user, res, 201, "User is created");
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Please enter the email and password",404));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new AppError("Password or Email is incorrect",404));

  const isPasswordCorrect = await user.confirmPassword(password, user.password);

  if (!isPasswordCorrect)
    return next(new AppError("Password or Email is incorrect",404));

  createSendToken(user, res, 200, "User is logged in successfully");
});

exports.protect = catchAsync(async (req, res, next) => {
  console.log("Protect middleware is called");

  if (!req.headers.authorization) return next(new AppError("Please log in",404));

  const token = req.headers.authorization.split(" ")[1];
  const payload = jwt.verify(token, process.env.JWT_SECRET);

  if (!payload) return next(new AppError("Please Login again.",404));

  console.log(payload);
  const user = await User.findById(payload._id);

  if (!user) return next(new AppError("User Not found",404));

  const isPasswordChanged = user.passwordChanged(payload.iat);
  if (isPasswordChanged)
    return next(new AppError("Please log in again, your token has expired",404));

  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role))
        return next(new AppError("You are not authenticated for this",404));
      next();
    } catch (err) {
      err.status = 403;
      return next(err);
    }
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("Please enter the correct email",404));

  const resetToken = user.generateResetToken();
  await user.save({ validateBeforeSave: false }); //to save the changes in the current user

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  await sendMail({
    email: user.email,
    subject: "The reset password",
    text: `Your otp for password reset are: ${resetToken}`,
  });
  respond(res, 200, "Reset Token is generated", resetToken);
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const resetToken = req.params.resetToken;
  const { password, confirmPassword } = req.body;

  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  if (!password || !confirmPassword)
    return next(
      new AppError("Please provide the password and confirm Password",404)
    );

  const user = await User.findOne({ passwordResetToken: resetTokenHash });
  if (!user) return next(new AppError("Your token is not correct",404));

  const isTokenValid = user.checkResetToken(resetToken);
  if (!isTokenValid) return next(new AppError("Your token expired",404));

  user.updatePassword(password, confirmPassword);
  const query = await user.save();

  createSendToken(user, res, 201, "User password is created successfully");
});
