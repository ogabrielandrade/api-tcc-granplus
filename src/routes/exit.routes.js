const express = require("express");
const router = express.Router();
const exitController = require("../controllers/exit.controller");
const authenticateToken = require("../middlewares/authenticateToken");

router.use(authenticateToken);

// Rotas para as saídas de produtos - as requisições requerem um token de autenticação
router.get("/", exitController.getAllExits); // Listar todas as saídas
router.post("/", exitController.registerExit); // Registrar nova saída

module.exports = router;