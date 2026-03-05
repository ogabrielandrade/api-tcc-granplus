const express = require("express");
const { calculateStock } = require("../controllers/stock.controller.js");

const router = express.Router();

router.get("/:id", calculateStock);

module.exports = router;
