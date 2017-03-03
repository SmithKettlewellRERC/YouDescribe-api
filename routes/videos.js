const express = require('express');

const router = express.Router();
const videosController = require('../controllers/videosController');

router.post('/', videosController.addOne);
router.put('/:id', videosController.updateOne);
router.get('/:id', videosController.getOne);

module.exports = router;
