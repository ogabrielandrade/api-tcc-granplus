const router = require("express").Router();
const {
  getDashboardResume,
  resumeForProduct,
} = require("../controllers/dashboard.controller");
const requireOwnerOrAdmin = require("../middlewares/owner");

router.get("/resumo", requireOwnerOrAdmin, getDashboardResume);
router.get("/resumo/:pdt_id", requireOwnerOrAdmin, resumeForProduct);

module.exports = router;
