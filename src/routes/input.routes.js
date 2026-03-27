const express = require("express");
const inputController = require("../controllers/input.controller");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.post("/", authenticateToken, inputController.registerInput);

module.exports = router;
