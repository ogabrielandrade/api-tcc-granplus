// ROTAS

const express           = require("express");
const router            = express.Router();
const productController = require("../controllers/product.controller");
const authenticateToken = require("../middlewares/authenticateToken");

router.get("/", authenticateToken, productController.listProducts); // '/produtos' listar todos os produtos
router.get("/historico/:id", authenticateToken, productController.historicalMoviments,); // '/produtos/movimentacoes/id' histórico de movimentações por id
router.post("/", authenticateToken, productController.createProduct); // '/produtos' criar produto
router.put("/:id", authenticateToken, productController.updateProduct); // '/produtos/id' atualizar produto 
router.delete("/:id", authenticateToken, productController.deleteProduct); // '/id' deletar produto (torná-lo inativo)

module.exports = router;
