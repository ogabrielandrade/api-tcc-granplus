const express = require("express");
const inputController = require("../controllers/input.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const router = express.Router();
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

// Rotas para Entrada
router.get("/", inputController.getAllInputs); 
router.post("/", inputController.registerInput); 

// ROTAS GERENCIAIS (Apenas Administradores)
router.put("/:id", requireAdmin, inputController.updateInput); 
router.delete("/:id", requireAdmin, inputController.deleteInput); 

module.exports = router;
