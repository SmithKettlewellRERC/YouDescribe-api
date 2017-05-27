const express = require('express');
const multer = require('multer');
const userTokenValidator = require('./../middlewares/userTokenValidator');
const upload = multer({ dest: 'tmp/' });
const router = express.Router();
const audioClipsController = require('../controllers/audioClipsController');

router.post('/:videoId', upload.single('wavfile'), userTokenValidator, audioClipsController.addOne);
router.delete('/:audioClipId', userTokenValidator, audioClipsController.delOne);
router.put('/:audioClipId', userTokenValidator, audioClipsController.updateOne);

module.exports = router;
