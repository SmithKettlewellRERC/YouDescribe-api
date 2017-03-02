const express = require('express');

const router = express.Router();
const wishListController = require('../controllers/wishListController');

router.post('/', wishListController.addOne);
router.get('/', wishListController.getAll);
router.get('/:id', wishListController.getOne);

module.exports = router;
