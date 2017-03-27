const express = require('express');
const router = express.Router();
const wishListController = require('../controllers/wishListController');
const googleTokenValidator = require('./../middlewares/googleTokenValidator');

router.post('/', googleTokenValidator, wishListController.addOne);
router.get('/:id', wishListController.getOne);
router.get('/', wishListController.getAll);
router.put('/:id', googleTokenValidator, wishListController.updateOne);

module.exports = router;
