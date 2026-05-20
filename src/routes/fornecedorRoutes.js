const express = require("express");
const router = express.Router();
const controller = require("../controllers/fornecedorController");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);

// ROTAS GERENCIAIS (Apenas Administradores)
router.delete("/:id", requireAdmin, controller.delete);

module.exports = router;