const User = require("../model/user");
const apiFeature = require("../util/apiFeatures");
const jwt = require("jsonwebtoken");
const respond = require("../services/respond");
const Activity = require("../model/activity");
const ApiFeature = require("../util/apiFeatures");
const catchAsync = require("../services/catchAsync");
const AppError = require("../services/AppError");
//const bcrypt = require('bcryptjs');

exports.myActivities = catchAsync(async (req, res, next) => {
  //const id = req.params.userId;
  let query = Activity.find({
    _id: {
      $in: req.user.createdActivity,
    },
  }).select(["-__v", "-id", "-_id", "-location", "-createdBy"]);

  const activityQuery = new ApiFeature(query, req.query).limit();

  const activity = await activityQuery.query;
  respond(res, 200, "The activities created by the user", activity);
});

exports.activitiesNearMe = catchAsync(async (req, res, next) => {
  console.log(req.query);

  const { latitude, longitude, distance } = req.query;
  if ((!latitude || !longitude, !distance))
    return next(
      new AppError("Please provide the coordinates and the distance", 404)
    );

  const query = await Activity.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude * 1, latitude * 1],
        },
        spherical: true,
        maxDistance: distance * 1,
        distanceField: "distance",
        distanceMultiplier: 1,
      },
    },
  ]);
  const filterData = [];
  query.forEach((place) => {
    filterData.push({
      name: place.name,
      distance: place.distance.toFixed(2) + "m",
    });
  });

  respond(res, 200, `The places near you within ${distance}m`, filterData);
});
