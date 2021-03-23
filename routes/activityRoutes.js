const express = require('express');

const router = express.Router();

const activityController = require('../controller/activityController');
const authController = require('../controller/authController');


router
  .route('/')
  .get(authController.protect, activityController.getAllActivity)
  .post(authController.protect, activityController.createActivity);

router
  .route('/:id')
  .get(authController.protect, activityController.getActivity)
  .patch(authController.protect ,activityController.updateActivity)
  .delete(authController.protect, authController.protect, activityController.deleteActivity);

module.exports = router;
