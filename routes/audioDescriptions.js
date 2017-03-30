const express = require('express');
const router = express.Router();
const audioDescriptionsController = require('../controllers/audioDescriptionsController');
const googleTokenValidator = require('./../middlewares/googleTokenValidator');

router.post('/:audioDescriptionId', googleTokenValidator, audioDescriptionsController.publishUnpublish);

module.exports = router;
