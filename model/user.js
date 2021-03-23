const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 4,
    maxlength: 16,
    required: [true, "Please fill your name"],
  },
  phone:{
    type: Number,
    required: [true, 'Please enter the phone number.']
  },
  email: {
    type: String,
    required: [true, "Please fill your email"],
    unique: [true,'Your email already exists'],
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photoUrl: {
    type: String,
  },
  age:{
    type:Number,
    required:[true,'Please enter your Age'],
  },
  deviceType:{
    type:String,
    required:[true,"Please Enter the Device Type"]
  },
  password: {
    type: String,
    required: [true, "Please fill your password"],
    select: false,
    minlength: 8,
    //validate: [validator.isStrongPassword, 'Please enter a Strong password'],
  },
  passwordUpdatedAt: {
    type: Date,
    Default: Date.now(),
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetTokenExpire: {
    type: Date,
  },
  createdActivity: {
    type: [mongoose.Schema.ObjectId],
    ref: "Activity",
  },
  joinedActivity: {
    type: [mongoose.Schema.ObjectId],
    ref: "Activity",
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordUpdatedAt = Date.now() - 1000;
  next();
});

userSchema.methods.confirmPassword = async (password, passwordHash) => {
  return await bcrypt.compare(password, passwordHash);
};

userSchema.methods.passwordChanged = function (JWTCreated) {
  const changedTimeStamp = parseInt(this.passwordUpdatedAt.getTime() / 1000);
  console.log(changedTimeStamp, JWTCreated);
  if (JWTCreated < changedTimeStamp) return true;
  return false;
};

userSchema.methods.generateResetToken = function () {
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetToken = resetTokenHash;
  this.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000;
  // 10 min + current time

  return resetToken;
};

userSchema.methods.checkResetToken = function (token) {
  return Date.now() < this.passwordResetTokenExpire;
};

userSchema.methods.updatePassword = function (password, confirmPassword) {
  this.password = password;
  this.passwordConfirm = confirmPassword;

  this.passwordResetToken = undefined;
  this.passwordResetTokenExpire = undefined;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
