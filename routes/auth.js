const express = require('express');
const passport = require("passport");
const apiMessages = require("../shared/apiMessages");
const config = require("../shared/config")();
const authController = require('../controllers/authController');

const router = express.Router();

router.post("/", authController.googleAuth);

router.get("/google",
  passport.authenticate("google", { scope: ["profile","email","openid"] })
);
router.get("/google/callback",
  passport.authenticate("google",
                        {
                            successRedirect: config.passportRedirectUrl,
                            failureRedirect: config.passportRedirectUrl,
                            failureFlash: "Sign In Unsuccessful. Please try again!"
                        })
);
router.get("/apple", passport.authenticate('apple', { scope: ['name', 'email'] }));

router.get("/apple/callback", function(req, res, next) {
    console.log("Handling Apple Callback");
    console.log('Request Body:', req.body);
    passport.authenticate('apple', function(err, user, info) {
        if (err) {
            if (err == "AuthorizationError") {
                res.send("Oops! Looks like you didn't allow the app to proceed. Please sign in again! <br /> \
                <a href=\"/login\">Sign in with Apple</a>");
            } else if (err == "TokenError") {
                res.send("Oops! Couldn't get a valid token from Apple's servers! <br /> \
                <a href=\"/login\">Sign in with Apple</a>");
            } else {
                res.send(err);
            }
        } else {
            if (req.body.user) {
                res.json({
                    user: req.body.user,
                    idToken: user
                });
            } else {
                res.json(user);
            }			
        }
    })(req, res, next);
});

router.get("/login/success", (req, res) => {
    console.log("Request on /auth/login/success ", req);
    if(req.user){
        const ret = apiMessages.getResponseByCode(1012);
        ret.result = req.user;
        res.status(ret.status).json(ret);
    } else {
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
    }
});
router.get("/logout", (req,res) => {
    req.logout();
    res.redirect(config.passportRedirectUrl);
});

module.exports = router;
