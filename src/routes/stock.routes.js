const express = require("express");
const { calculateStock, getAllStock } = require("../controllers/stock.controller.js");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

const router = express.Router();
router.use(authenticateToken);

router.get("/", requireAdmin, getAllStock); 
router.get("/:id", requireAdmin, calculateStock); 

module.exports = router;
