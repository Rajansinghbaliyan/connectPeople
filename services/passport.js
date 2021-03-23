const passport = require("passport");
const googleStrategy = require("passport-google-oauth20").Strategy;
const facebookStrategy = require("passport-facebook");
const User = require("../model/user");

passport.use(
  new googleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/connectc/v1/users/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          done(null, user);
        } else {
          user = await new User({
            name: profile.displayName,
            email: profile.emails[0].value,
          }).save({ validateBeforeSave: false });
          done(null, user);
        }
      } catch (err) {
        err.status = 400;
      }
    }
  )
);

/*
passport.use(
  new facebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "/connectc/v1/users/auth/facebook/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          done(null, user);
        } else {
          user = await new User({
            name: profile.displayName,
            email: profile.emails[0].value,
          }).save({ validateBeforeSave: false });
          done(null, user);
        }
      } catch (err) {
        err.status = 400;
      }
    }
  )
);
*/
