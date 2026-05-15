// ROTAS

const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", productController.listAllProducts); 
router.get("/historico/:id", productController.historicalMoviments); 

// ROTAS GERENCIAIS (Apenas Administradores)
router.post("/", requireAdmin, productController.createProduct); 
router.put("/:id", requireAdmin, productController.updateProduct); 
router.delete("/:id", requireAdmin, productController.deleteProduct); 

module.exports = router;