const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const conf = require("../shared/config")();
const nowUtc = require("../shared/dateTime").nowUtc;
const crypto = require('crypto');
const AppleStrategy = require('passport-apple');
const path = require('path');
const jsonwebtoken = require('jsonwebtoken');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  name: String,
  given_name: String,
  picture: String,
  locale: String,
  google_user_id: String,
  apple_user_id: String,
  created_at: Number,
  updated_at: Number,
  last_login: Number,
  status: String,
  token: String,
  opt_in: [],
  policy_review: String,
  admin: Number,
}, { collection: "users" });

// passportLocalMongoose is a middleware that adds the createStrategy method when plugged in to the user schema.
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
    callbackURL: conf.passportCallbackUrl,
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

passport.use(
  new AppleStrategy(
    {
      clientID: conf.AppleClientId,
      teamID: conf.AppleTeamId,
      keyID: conf.AppleKeyId,
      privateKeyLocation: path.join(__dirname, '../AuthKey_57HVXW9Y8Z.p8'),
      callbackURL: conf.AppleCallbackUrl,
    },
    async (req, accessToken, refreshToken, idToken, profile, cb) => {
      const decodedToken = jsonwebtoken.decode(idToken);
      const { sub, email } = decodedToken;
      console.log("sub", sub);
      console.log("email", email);

      const firstTimeUser = typeof req.query['user'] === 'string' ? JSON.parse(req.query['user']) : undefined;
      const newToken = crypto
        .createHmac('sha256', conf.cryptoSecret)
        .update(CRYPTO_SEED + moment().utc().format('YYYYMMDDHHmmss'))
        .digest('hex');

      try {
        User.findOneAndUpdate(
          { apple_user_id: sub },
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
                apple_user_id: sub,
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
      } catch (error) {
        return cb(error, null);
      }
    },
  ),
);

module.exports = User;
