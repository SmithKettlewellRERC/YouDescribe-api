const express = require('express');
const router = express.Router();
const audioDescriptionsController = require('../controllers/audioDescriptionsController');
const userTokenValidator = require('./../middlewares/userTokenValidator');

router.post('/:videoId', userTokenValidator, audioDescriptionsController.createOne);

router.put('/:audioDescriptionId', userTokenValidator, audioDescriptionsController.updateAudioDescription);

router.delete('/:audioDescriptionId', userTokenValidator, audioDescriptionsController.deleteAudioDescription);

module.exports = router;
