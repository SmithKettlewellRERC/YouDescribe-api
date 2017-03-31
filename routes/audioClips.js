const express = require('express');
const multer = require('multer');
const userTokenValidator = require('./../middlewares/userTokenValidator');
const upload = multer({ dest: 'uploads/tmp/' });
const router = express.Router();
const audioClipsController = require('../controllers/audioClipsController');

router.post('/:videoId', upload.single('wavfile'), userTokenValidator, audioClipsController.addOne);

module.exports = router;
