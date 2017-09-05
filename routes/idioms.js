const express = require('express');
const router = express.Router();
const idiomsController = require('../controllers/idiomsController');

router.get('/', idiomsController.getAll);

module.exports = router;
