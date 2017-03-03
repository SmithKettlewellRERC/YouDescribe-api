const express = require('express');

const router = express.Router();
const audioClipsController = require('../controllers/audioClipsController');

router.post('/:videoId', audioClipsController.addOne);
router.post('/:videoId/:audioDescriptionId', audioClipsController.addOne);
// router.get('/:id', audioClipsController.getOne);

module.exports = router;
