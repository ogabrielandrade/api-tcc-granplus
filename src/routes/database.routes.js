const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/database.controller');

router.get('testebanco', databaseController.testDataBase);

module.exports = router;