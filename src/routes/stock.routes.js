const express = require("express");
const { calculateStock } = require("../controllers/stock.controller.js");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.get("/:id", authenticateToken, calculateStock);

module.exports = router;
