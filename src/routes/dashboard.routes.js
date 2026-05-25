const router = require("express").Router();
const {
  getDashboardResume,
  resumeForProduct,
} = require("../controllers/dashboard.controller");

const authenticateToken = require("../middlewares/authenticateToken"); 
const requireOwnerOrAdmin = require("../middlewares/owner");


router.get("/resumo", authenticateToken, requireOwnerOrAdmin, getDashboardResume);
router.get("/resumo/:pdt_id", authenticateToken, requireOwnerOrAdmin, resumeForProduct);

module.exports = router;