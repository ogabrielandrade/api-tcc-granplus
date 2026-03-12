const express = require('express');
const authenticateToken = require('../middlewares/authenticateToken');
const { getMoreMovedProducts, minimumStock } = require('../controllers/report.controller');

const router = express.Router();

router.get("/produtos-mais-movimentados", authenticateToken, getMoreMovedProducts);
router.get("/estoque-minimo", authenticateToken, minimumStock);

module.exports = router;