const mongoose = require("../util/database");

const activitySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "A tour must have a Name"] },
    deviceType: {
      type: String,
      required: [true, "Please Enter the Device Type"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    address: {
      type: "String",
      required: [true, "Please enter the address"],
    },
    startDate: {
      type: Date,
      required: [true, "Please enter the start date"],
    },
    endDate: {
      type: Date,
      required: [true, "Please enter the end date"],
    },
    time: {
      type: String,
      required: [true, "Please enter the time"],
    },
    category: {
      type: Number,
      required: [true, "Please enter the category"],
    },
    ageGroup: {
      type: Number,
      required: [true, "Please enter the age group"],
    },
    gender: {
      type: Number,
      required: [true, "Please enter the Gender"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A Tour must required a max group size"],
    },
    peopleJoined: {
      type: Number,
      validate: {
        validator: function (el) {
          return el <= this.maxGroupSize;
        },
        message: "This activity group is full, no more space is left",
      },
    },
    price: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: [true, "Please enter the description for the activity"],
    },
    imageCoverUrl: {
      type: String,
      required: [true, "A Tour must required a Image"],
    },
    mediaUrl: [String],
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

activitySchema.index({location:'2dsphere'});

const activity = mongoose.model("Activity", activitySchema);

module.exports = activity;
