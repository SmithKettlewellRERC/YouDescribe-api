const express = require('express');

const router = express.Router();
const audioClipsController = require('../controllers/audioClipsController');

router.post('/', audioClipsController.addOne);
router.get('/:id', audioClipsController.findOne);

module.exports = router;
