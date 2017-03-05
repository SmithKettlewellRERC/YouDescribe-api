const express = require('express');

const router = express.Router();
const videosController = require('../controllers/videosController');

router.post('/', videosController.addOne);
router.get('/', videosController.getAll);
router.put('/:id', videosController.updateOne);
router.get('/:id', videosController.getOne);

module.exports = router;
