const express = require('express');
const router = express.Router();
const videosController = require('../controllers/videosController');
const googleTokenValidator = require('./../middlewares/googleTokenValidator');


router.get('/', videosController.getAll);
router.get('/search', videosController.search);
router.get('/:id', videosController.getOne);
router.get('/user/:userId', videosController.getVideosByUserId);
// router.post('/', videosController.addOne);
// router.put('/:id', videosController.updateOne);
// router.post('/:id', googleTokenValidator, videosController.publish);

module.exports = router;
