const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");

router.post("/sendemail", usersController.sendMail);
router.post("/sendoptinemail", usersController.sendOptInEmail);
router.post(
  "/sendvideoremappingemail",
  usersController.sendVideoRemappingEmail
);
router.post("/sendvideoindexeremail", usersController.sendVideoIndexerEmail);
router.post("/updateoptin", usersController.updateOptIn);
router.get("/:userId", usersController.getOne);

module.exports = router;
