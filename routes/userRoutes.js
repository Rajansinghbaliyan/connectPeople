const express = require('express');

const router = express.Router();
const userController = require('../controller/userController');
const authController = require('../controller/authController');
const passport = require('passport');


router.route('/signup').post(authController.signup);

router.route('/auth/google').get(passport.authenticate('google',{ scope:['profile','email']}));
router.route('/auth/google/callback').get(passport.authenticate('google'), authController.googleCallback);

router.route('/login').post(authController.login);
router.route('/forgetPassword').post(authController.forgetPassword);
router.route('/resetPassword/:resetToken').patch(authController.resetPassword);

module.exports = router;