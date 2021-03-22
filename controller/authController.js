const User = require('../model/user');
const jwt = require('jsonwebtoken');
const respond = require('../services/respond');
const sendMail = require('../util/email');
const crypto = require('crypto');

const createSendToken = (user, res, status, message) => {
  const token = signToken(user.id);
  respond(res, status, message, token);
};

const signToken = (id) => {
  return jwt.sign({ _id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res, next) => {
  try {
    console.log('In the signup')
    const data = req.body;
    const user = await User.create({
      name: data.name,
      email: data.email,
      //photoUrl: req.file.path,
      password: data.password,
      age: data.age,
    });

    createSendToken(user, res, 201, 'User is created');

  } catch (err) {
    err.status = 400;
    return next(err);
  }
};

exports.welcome = (req,res,next)=>{
  respond(res,200,"Hello There");
}
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new Error('Please enter the email and password');

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) throw new Error('Password or Email is incorrect');

    const isPasswordCorrect = await user.confirmPassword(
      password,
      user.password
    );

    if (!isPasswordCorrect) throw new Error('Password or Email is incorrect');

    createSendToken(user, res, 200, 'User is logged in successfully');
    
  } catch (err) {
    err.status = 401;
    return next(err);
  }
};

exports.protect = async (req, res, next) => {
  try {
    console.log('Protect middleware is called');

    if (
      !req.headers.authorization &&
      !req.headers.authorization.startsWith('Bearer')
    )
      throw new Error('Please log in');

    const token = req.headers.authorization.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload) throw new Error('Please Login again.');

    console.log(payload);
    const user = await User.findById(payload._id);

    if (!user) throw new Error('User Not found');

    const isPasswordChanged = user.passwordChanged(payload.iat);
    if (isPasswordChanged)
      throw new Error('Please log in again, your token has expired');

    req.user = user;
    next();
  } catch (err) {
    err.status = 401;
    return next(err);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role))
        throw new Error('You are not authenticated for this');
      next();
    } catch (err) {
      err.status = 403;
      return next(err);
    }
  };
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error('Please enter the correct email');

    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false }); //to save the changes in the current user

    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await sendMail({
      email: user.email,
      subject: 'The reset password',
      text:`Your otp for password reset are: ${resetToken}`,
    });
    respond(res, 200, 'Reset Token is generated', resetToken);
  } catch (err) {
    err.status = 404; 
    return next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetToken = req.params.resetToken;
    const { password, confirmPassword } = req.body;

    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    if (!password || !confirmPassword)
      throw new Error('Please provide the password and confirm Password');

    const user = await User.findOne({ passwordResetToken: resetTokenHash });
    if (!user) throw new Error('Your token is not correct');

    const isTokenValid = user.checkResetToken(resetToken);
    if (!isTokenValid) throw new Error('Your token expired');

    user.updatePassword(password, confirmPassword);
    const query = await user.save();

    createSendToken(user, res, 201, 'User password is created successfully');
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};