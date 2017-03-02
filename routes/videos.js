const express = require('express');

const router = express.Router();
const videosController = require('../controllers/videosController');

// router.post('/', audioClipsController.addOne);
router.get('/:id', videosController.getOne);

module.exports = router;
