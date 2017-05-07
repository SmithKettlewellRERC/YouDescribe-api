const express = require('express');
const router = express.Router();
const overallRatingsController = require('../controllers/overallRatingsController');
const userTokenValidator = require('./../middlewares/userTokenValidator');

// router.post('/:audioDescriptionId', userTokenValidator, overallRatingsController.addOne);
router.post('/:audioDescriptionId', overallRatingsController.addOne);

module.exports = router;
