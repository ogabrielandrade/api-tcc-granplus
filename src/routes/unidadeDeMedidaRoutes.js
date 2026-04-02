const express = require("express");
const router = express.Router();
const controller = require("../controllers/unidadeDeMedidaController");

const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

// 1. Escudo Base: Ninguém entra sem estar logado (Token JWT)
router.use(authenticateToken);

// ROTAS GERAIS (Qualquer usuário logado)
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// ROTAS RESTRITAS (Apenas Administradores)
router.post("/", requireAdmin, controller.create);
router.put("/:id", requireAdmin, controller.update);
router.delete("/:id", requireAdmin, controller.delete);

module.exports = router;
