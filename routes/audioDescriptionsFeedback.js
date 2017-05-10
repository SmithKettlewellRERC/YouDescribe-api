const express = require('express');
const router = express.Router();
const audioDescriptionsFeedbackController = require('../controllers/audioDescriptionsFeedbackController');
const userTokenValidator = require('./../middlewares/userTokenValidator');

router.post('/:audioDescriptionId', userTokenValidator, audioDescriptionsFeedbackController.addOne);

module.exports = router;
