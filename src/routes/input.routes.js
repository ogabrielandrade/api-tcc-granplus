const express = require("express");
const inputController = require("../controllers/input.controller");
const authenticateToken = require("../middlewares/authenticateToken");
const router = express.Router();
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authenticateToken);

// Rotas para Entrada
router.get("/", inputController.getAllInputs);  
router.post("/", inputController.registerInput); 
router.put("/:id", inputController.updateInput); 

// ROTAS GERENCIAIS (Apenas Administradores)
router.delete("/:id", requireAdmin, inputController.deleteInput); 

module.exports = router;
