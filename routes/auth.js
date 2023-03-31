const express = require('express');
const passport = require("passport");
const apiMessages = require("../shared/apiMessages");

const router = express.Router();

router.get("/google",
  passport.authenticate("google", { scope: ["profile","email","openid"] })
);
router.get("/google/callback",
  passport.authenticate("google",
                        {
                            successRedirect: "https://youdescribe.org",
                            failureRedirect: "https://youdescribe.org",
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
    res.redirect("https://youdescribe.org");
});

module.exports = router;
