// ROTAS

const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", productController.listProducts); // '/produtos' listar todos os produtos
router.get("/historico/:id", productController.historicalMoviments); // '/produtos/movimentacoes/id' histórico de movimentações por id

// ROTAS GERENCIAIS (Apenas Administradores)
router.post("/", requireAdmin, productController.createProduct); // '/produtos' criar produto
router.put("/:id", requireAdmin, productController.updateProduct); // '/produtos/id' atualizar produto 
router.delete("/:id", requireAdmin, productController.deleteProduct); // '/id' deletar produto (torná-lo inativo)

module.exports = router;