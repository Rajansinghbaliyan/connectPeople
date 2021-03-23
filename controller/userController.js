const User = require("../model/user");
const apiFeature = require("../util/apiFeatures");
const jwt = require("jsonwebtoken");
const respond = require("../services/respond");
const Activity = require("../model/activity");
//const bcrypt = require('bcryptjs');

exports.myActivities = async (req, res, next) => {
  try {
    //const id = req.params.userId;
    const activity = await Activity.find({
      _id: {
        $in: req.user.createdActivity,
      },
    }).select(["-__v", "-id", "-_id", "-location", "-createdBy"]);

    respond(res, 200, "The activities created by the user", activity);
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};
exports.activitiesNearMe = async (req, res, next) => {
  try {
    console.log(req.query);

    const { latitude, longitude, distance } = req.query;
    if ((!latitude || !longitude, !distance))
      throw new Error("Please provide the coordinates and the distance");

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
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};
