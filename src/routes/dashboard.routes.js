const express = require("express");
const router = express.Router();

const {getDashboardResume, resumeForProduct} = require("../controllers/dashboard.controller");

router.get("/resumo", getDashboardResume);
router.get("/resumo/:pdt_id", resumeForProduct);

module.exports = router;
