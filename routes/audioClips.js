const express = require('express');
const multer = require('multer');
const userTokenValidator = require('./../middlewares/userTokenValidator');
const upload = multer({ dest: 'audio-descriptions-files/tmp/' });
const router = express.Router();
const audioClipsController = require('../controllers/audioClipsController');

router.post('/:videoId', upload.single('wavfile'), userTokenValidator, audioClipsController.addOne);

module.exports = router;
