const express = require('express');

const router = express.Router();
const userController = require('../controller/userController');
const authController = require('../controller/authController');

router.route('/signup').post(authController.signup);

router.route('/auth/google').get(authController.googleAuth);
router.route('/auth/google/callback').get(authController.googleCallback);

router.route('/auth/facebook').get(authController.facebookAuth);
router.route('/auth/facebook/callback').get(authController.facebookCallback);

router.route('/login').post(authController.login);
router.route('/forgetPassword').post(authController.forgetPassword);
router.route('/resetPassword/:resetToken').patch(authController.resetPassword);


router.route('/createdActivity').get(authController.protect,userController.myActivities);
router.route('/nearActivity').get(authController.protect,userController.activitiesNearMe);

module.exports = router;