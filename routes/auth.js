const express = require('express');
const passport = require("passport");
const apiMessages = require("../shared/apiMessages");
const config = require("../shared/config")();

const router = express.Router();

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
