const express = require('express');
const inputController = require('../controllers/input.controller');

const router = express.Router();

router.post('/entradas', inputController.registerInput);

module.exports = router;