const express = require("express");
const router = express.Router();
const localizacaoController = require("../controllers/localizacaoController");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", localizacaoController.listarLocalizacoes);
router.get("/:id", localizacaoController.buscarLocalizacao);

// ROTAS GERENCIAIS (Apenas Administradores)
router.post("/", requireAdmin, localizacaoController.criarLocalizacao);
router.put("/:id", requireAdmin, localizacaoController.atualizarLocalizacao);
router.delete("/:id", requireAdmin, localizacaoController.deletarLocalizacao);

module.exports = router;
