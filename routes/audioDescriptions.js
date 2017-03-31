const express = require('express');
const router = express.Router();
const audioDescriptionsController = require('../controllers/audioDescriptionsController');
const userTokenValidator = require('./../middlewares/userTokenValidator');

router.post('/:audioDescriptionId', userTokenValidator, audioDescriptionsController.publishUnpublish);

module.exports = router;
