const express = require('express');

const router = express.Router();
const videosController = require('../controllers/videosController');

router.get('/', videosController.getAll);
router.get('/:id', videosController.getOne);
router.get('/search', videosController.search);
// router.post('/', videosController.addOne);
// router.put('/:id', videosController.updateOne);

module.exports = router;
