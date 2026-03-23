const express = require('express');
const router = express.Router();

const {getDashboardResume} = require('../controllers/dashboard.controller');

router.get('/resumo', getDashboardResume);

module.exports = router;