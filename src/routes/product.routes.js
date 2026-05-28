const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", productController.listAllProducts); 
router.get("/historico/:id", productController.historicalMoviments); 
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct); 
router.delete("/:id", productController.deleteProduct);

module.exports = router;