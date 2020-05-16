const express = require("express");
const router = express.Router();
const adminsController = require("../controllers/adminsController");

router.post("/signin", adminsController.signIn);

module.exports = router;
