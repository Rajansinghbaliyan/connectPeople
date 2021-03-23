const Activity = require("../model/activity");
const APIFeatures = require("../util/apiFeatures");
const respond = require("../services/respond");

exports.getAllActivity = async (req, res, next) => {
  try {
    const features = new APIFeatures(Activity.find(), req.query);

    features.filter().sort().fields().limit();
    const activity = await features.query;

    respond(res, 201, "success", activity);
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};

exports.createActivity = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;

    req.body.location = {
      type: "Point",
      coordinates: [longitude, latitude],
      address,
    };
    req.body.createdBy = req.user._id;
    //req.body.imageCoverUrl = req.file.path;
    req.body.gender = req.body.gender.toLowerCase();
    const activity = await Activity.create(req.body);
    const {
      name,
      time,
      price,
      startDate,
      endDate,
      gender,
      ageGroup,
      description,
      category,
      maxGroupSize,
    } = activity;

    const filterData = {
      name,
      time,
      price,
      startDate,
      endDate,
      gender,
      ageGroup,
      description,
      category,
      maxGroupSize,
      locationLatitude: latitude,
      locationLongitude: longitude,
      locationAddress: address,
    };

    respond(res, 201, "success", filterData);
    req.user.createdActivity.push(activity._id);
    req.user.save();
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};

exports.getActivity = (req, res, next) => {
  const id = parseInt(req.params.id);
  Activity.findOne({ id: id })
    .then((activity) => {
      respond(res, 200, "success", activity);
    })
    .catch((err) => {
      err.status = 400;
      return next(err);
    });
};

exports.updateActivity = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const activity = await Activity.findOneAndUpdate({ id: id }, req.body, {
      new: true,
    });

    respond(res, 200, "success", activity);
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};

exports.deleteActivity = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    console.log(req.body);
    const activity = await Activity.findByIdAndDelete({ id: id });

    respond(res, 200, "success", activity);
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};

exports.getActivityStats = async (req, res, next) => {
  try {
    const stats = await Activity.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: "$difficulty", //group for each and every difficulty
          numTours: { $sum: 1 }, //it will add 1 to sum for each record passed into it
          countRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          maxPrice: { $max: "$price" },
          minPrice: { $min: "$price" },
        },
      },
      {
        $sort: {
          avgPrice: 1,
        },
      },
    ]);

    return respond(res, 200, "success", stats);
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};
