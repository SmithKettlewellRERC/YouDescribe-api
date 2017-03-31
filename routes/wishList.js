const express = require('express');
const router = express.Router();
const wishListController = require('../controllers/wishListController');
const userTokenValidator = require('./../middlewares/userTokenValidator');

router.post('/', userTokenValidator, wishListController.addOne);
router.get('/:youTubeId', wishListController.getOne);
router.get('/', wishListController.getAll);
router.put('/:youTubeId', userTokenValidator, wishListController.updateOne);

module.exports = router;
