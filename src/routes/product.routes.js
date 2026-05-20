const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", productController.listAllProducts); // '/produtos' listar todos os produtos
router.get("/historico/:id", productController.historicalMoviments); // '/produtos/movimentacoes/id' histórico de movimentações por id
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct); // '/produtos/id' atualizar produto 

// ROTAS GERENCIAIS (Apenas Administradores)
router.delete("/:id", requireAdmin, productController.deleteProduct); // '/id' deletar produto (torná-lo inativo)

module.exports = router;