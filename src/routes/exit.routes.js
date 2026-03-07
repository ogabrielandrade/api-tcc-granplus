const express = require('express');
const router = express.Router();

const exitController = require('../controllers/exit.controller');

router.post('/saidas', exitController.registerExit);

module.exports = router;