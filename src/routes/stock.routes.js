const express = require("express");
const { calculateStock, getAllStock } = require("../controllers/stock.controller.js");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();
router.use(authenticateToken);

router.get("/", getAllStock);
router.get("/:id", calculateStock);

module.exports = router;
