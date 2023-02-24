const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const conf = require("../shared/config")();
const nowUtc = require("../shared/dateTime").nowUtc;
const crypto = require('crypto');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  name: String,
  given_name: String,
  picture: String,
  locale: String,
  google_user_id: String,
  created_at: Number,
  updated_at: Number,
  last_login: Number,
  status: String,
  token: String,
  opt_in: [],
  policy_review: String,
  admin: Number,
}, { collection: "users" });

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  console.log("Serializing User: ", user);
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  console.log("Deserializing User with ID: ", id);
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: "1061361249208-9799kv6172rjgmk4gad077639dfrck82.apps.googleusercontent.com",
    clientSecret: "emqt6gfCSMNlhHfpADZCEgqf",
    callbackURL: "http://localhost:8080/v1/auth/google/callback",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function verify(accessToken, refreshToken, profile, cb) {
    const payload = profile._json;
    const googleUserId = payload.sub;
    const newToken = crypto.createHmac('sha256', conf.cryptoSecret)
                           .update(conf.cryptoSeed + nowUtc())
                           .digest('hex');
    User.findOneAndUpdate(
      { google_user_id: googleUserId },
      { $set:
        {
          last_login: nowUtc(),
          updated_at: nowUtc(),
          token: newToken,
        }
      },
      { new: true },
      (err, user) => {
        if (err) {
          return cb(err,null);
        }
        if (user) {
          return cb(null,user);
        } else {
          const newUser = new User({
            email: payload.email,
            name: payload.name,
            given_name: payload.given_name,
            picture: payload.picture,
            locale: payload.locale,
            google_user_id: googleUserId,
            last_login: nowUtc(),
            token: newToken,
            opt_in: [],
          });
          newUser.save((errNewUser, newUser) => {
            if (errNewUser) {
              return cb(errNewUser,null);
            }
            if (newUser) {
              return cb(null,newUser);
            } else {
              return cb(err,null);                 
            }
          });
        }
      }
    );
  }
));

module.exports = User;
