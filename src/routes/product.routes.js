// ROTAS

const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authenticateToken = require("../middlewares/authenticateToken");

router.get("/", authenticateToken, productController.listProducts);
router.get(
  "/movimentacoes/:id",
  authenticateToken,
  productController.historicalMoviments,
);
router.post("/", authenticateToken, productController.createProduct);
router.put("/:id", authenticateToken, productController.updateProduct);
router.delete("/:id", authenticateToken, productController.deleteProduct);

module.exports = router;
