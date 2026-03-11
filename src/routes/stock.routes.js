const express = require("express");
const { calculateStock, getAllStock } = require("../controllers/stock.controller.js");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.get("/:id", authenticateToken, calculateStock);
router.use("/", authenticateToken, getAllStock);

module.exports = router;
