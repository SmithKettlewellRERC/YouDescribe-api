const express = require('express');
const router = express.Router();
const audioDescriptionsRatingController = require('../controllers/audioDescriptionsRatingController');
const userTokenValidator = require('./../middlewares/userTokenValidator');

// router.post('/:audioDescriptionId', userTokenValidator, audioDescriptionsRatingController.addOne);
router.post('/:audioDescriptionId', audioDescriptionsRatingController.addOne);

module.exports = router;
