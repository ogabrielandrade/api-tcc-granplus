const express = require('express');
const login   = require('../controllers/auth.controller.js');

const router = express.Router();

router.post("/auth/login", login);

module.exports = router;