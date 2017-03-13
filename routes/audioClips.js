const express = require('express');
const multer = require('multer');

const upload = multer({ dest: 'uploads/tmp/' });

const router = express.Router();
const audioClipsController = require('../controllers/audioClipsController');

router.post('/:videoId', upload.single('wavfile'), audioClipsController.addOne);

module.exports = router;
