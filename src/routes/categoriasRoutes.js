const express = require("express");
const router = express.Router();
const controller = require("../controllers/categoriasController");

// Middlewares de Segurança
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// ROTAS GERENCIAIS (Apenas Administradores)
router.post("/", requireAdmin, controller.create);
router.put("/:id", requireAdmin, controller.update);
router.delete("/:id", requireAdmin, controller.delete);

module.exports = router;