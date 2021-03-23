const Activity = require("../model/activity");
const APIFeatures = require("../util/apiFeatures");
const respond = require("../services/respond");

exports.getAllActivity = async (req, res, next) => {
  try {
    console.log(req.query);
    const features = new APIFeatures(Activity.find(), req.query);

    features.filter().sort().fields().limit();
    const activity = await features.query;
    activity.forEach(el=>{
      delete el._id;
    })
    respond(res, 201, "success", activity);
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};

exports.createActivity = async (req, res, next) => {
  try {
    const { latitude, longitude} = req.body;

    req.body.location = {
      type: "Point",
      coordinates: [longitude, latitude],
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
      address,
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

exports.getActivity =async (req, res, next) => {
  try{
  const id = req.params.id;
  const activity = await Activity.findById(id).select(["-__v", "-id", "-_id", "-createdBy",'-location']);
  
  if(!activity) throw new Error("The activity is not present")
  respond(res, 200, "success", activity);
    
  }catch(err){
    err.status = 400;
    return next(err);
  }

};

exports.updateActivity = async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log(req.user);
    if(!req.user.createdActivity.includes(id)) throw new Error("You are not authorized");
    const activity = await Activity.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if(!activity) throw new Error ("Please pass the correct id");
    respond(res, 200, "success", {});
  } catch (err) {
    err.status = 400;
    return next(err);
  }
};

exports.deleteActivity = async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log(req.body);
    if(!req.user.createdActivity.includes(id)) throw new Error("You are not authorized");
    const activity = await Activity.findByIdAndDelete(id);

    respond(res, 200, "success", activity);
    const removeDeletedId = req.user.createdActivity.filter(activity => activity != id);
    req.user.createdActivity = removeDeletedId;
    req.user.save();
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
