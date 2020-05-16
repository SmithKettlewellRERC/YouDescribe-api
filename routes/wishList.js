const express = require('express');
const router = express.Router();
const wishListController = require('../controllers/wishListController');
const userTokenValidator = require('./../middlewares/userTokenValidator');
const webVisitCounter = require("./../middlewares/webVisitCounter");
const videoVisitCounter = require("./../middlewares/videoVisitCounter");

router.get("/getbycategories", wishListController.getByCategories);

router.post('/', userTokenValidator, wishListController.addOne);
router.get('/:youTubeId', videoVisitCounter, wishListController.getOne);
router.get('/', webVisitCounter, wishListController.getAll);
router.put('/:youTubeId', userTokenValidator, wishListController.updateOne);

module.exports = router;
