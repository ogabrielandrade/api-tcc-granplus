const express = require("express");
const router = express.Router();
const controller = require("../controllers/unitOfMeasurement.controller");

const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

// 1. Escudo Base: Ninguém entra sem estar logado (Token JWT)
router.use(authenticateToken);

// ROTAS GERAIS (Qualquer usuário logado)
router.get("/", controller.getAllUnits);
router.get("/:id", controller.getUnitsById);

// ROTAS RESTRITAS (Apenas Administradores)
router.post("/", requireAdmin, controller.createUnits);
router.put("/:id", requireAdmin, controller.updateUnits);
router.delete("/:id", requireAdmin, controller.deleteUnits);

module.exports = router;
